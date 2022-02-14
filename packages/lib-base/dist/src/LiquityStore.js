"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiquityStore = void 0;
const assert_1 = __importDefault(require("assert"));
const strictEquals = (a, b) => a === b;
const eq = (a, b) => a.eq(b);
const equals = (a, b) => a.equals(b);
const frontendStatusEquals = (a, b) => a.status === "unregistered"
    ? b.status === "unregistered"
    : b.status === "registered" && a.kickbackRate.eq(b.kickbackRate);
const showFrontendStatus = (x) => x.status === "unregistered"
    ? '{ status: "unregistered" }'
    : `{ status: "registered", kickbackRate: ${x.kickbackRate} }`;
const wrap = (f) => (...args) => f(...args);
const difference = (a, b) => Object.fromEntries(Object.entries(a).filter(([key, value]) => value !== b[key]));
/**
 * Abstract base class of Liquity data store implementations.
 *
 * @remarks
 * The type parameter `T` may be used to type extra state added to {@link LiquityStoreState} by the
 * subclass.
 *
 * Implemented by {@link @liquity/lib-ethers#BlockPolledLiquityStore}.
 *
 * @public
 */
class LiquityStore {
    constructor() {
        /** Turn console logging on/off. */
        this.logging = false;
        /** @internal */
        this._loaded = false;
        this._listeners = new Set();
    }
    /**
     * The current store state.
     *
     * @remarks
     * Should not be accessed before the store is loaded. Assign a function to
     * {@link LiquityStore.onLoaded | onLoaded} to get a callback when this happens.
     *
     * See {@link LiquityStoreState} for the list of properties returned.
     */
    get state() {
        return Object.assign({}, this._baseState, this._derivedState, this._extraState);
    }
    /**
     * Start monitoring the blockchain for Liquity state changes.
     *
     * @remarks
     * The {@link LiquityStore.onLoaded | onLoaded} callback will be called after the state is fetched
     * for the first time.
     *
     * Use the {@link LiquityStore.subscribe | subscribe()} function to register listeners.
     *
     * @returns Function to stop the monitoring.
     */
    start() {
        const doStop = this._doStart();
        return () => {
            doStop();
            this._cancelUpdateIfScheduled();
        };
    }
    _cancelUpdateIfScheduled() {
        if (this._updateTimeoutId !== undefined) {
            clearTimeout(this._updateTimeoutId);
        }
    }
    _scheduleUpdate() {
        this._cancelUpdateIfScheduled();
        this._updateTimeoutId = setTimeout(() => {
            this._updateTimeoutId = undefined;
            this._update();
        }, 30000);
    }
    _logUpdate(name, next, show) {
        if (this.logging) {
            console.log(`${name} updated to ${show ? show(next) : next}`);
        }
        return next;
    }
    _updateIfChanged(equals, name, prev, next, show) {
        return next !== undefined && !equals(prev, next) ? this._logUpdate(name, next, show) : prev;
    }
    _silentlyUpdateIfChanged(equals, prev, next) {
        return next !== undefined && !equals(prev, next) ? next : prev;
    }
    _updateFees(name, prev, next) {
        if (next && !next.equals(prev)) {
            // Filter out fee update spam that happens on every new block by only logging when string
            // representation changes.
            if (`${next}` !== `${prev}`) {
                this._logUpdate(name, next);
            }
            return next;
        }
        else {
            return prev;
        }
    }
    _reduce(baseState, baseStateUpdate) {
        return {
            frontend: this._updateIfChanged(frontendStatusEquals, "frontend", baseState.frontend, baseStateUpdate.frontend, showFrontendStatus),
            ownFrontend: this._updateIfChanged(frontendStatusEquals, "ownFrontend", baseState.ownFrontend, baseStateUpdate.ownFrontend, showFrontendStatus),
            numberOfTroves: this._updateIfChanged(strictEquals, "numberOfTroves", baseState.numberOfTroves, baseStateUpdate.numberOfTroves),
            accountBalance: this._updateIfChanged(eq, "accountBalance", baseState.accountBalance, baseStateUpdate.accountBalance),
            zusdBalance: this._updateIfChanged(eq, "zusdBalance", baseState.zusdBalance, baseStateUpdate.zusdBalance),
            nueBalance: this._updateIfChanged(eq, "nueBalance", baseState.nueBalance, baseStateUpdate.nueBalance),
            zeroBalance: this._updateIfChanged(eq, "zeroBalance", baseState.zeroBalance, baseStateUpdate.zeroBalance),
            collateralSurplusBalance: this._updateIfChanged(eq, "collateralSurplusBalance", baseState.collateralSurplusBalance, baseStateUpdate.collateralSurplusBalance),
            price: this._updateIfChanged(eq, "price", baseState.price, baseStateUpdate.price),
            zusdInStabilityPool: this._updateIfChanged(eq, "zusdInStabilityPool", baseState.zusdInStabilityPool, baseStateUpdate.zusdInStabilityPool),
            total: this._updateIfChanged(equals, "total", baseState.total, baseStateUpdate.total),
            totalRedistributed: this._updateIfChanged(equals, "totalRedistributed", baseState.totalRedistributed, baseStateUpdate.totalRedistributed),
            troveBeforeRedistribution: this._updateIfChanged(equals, "troveBeforeRedistribution", baseState.troveBeforeRedistribution, baseStateUpdate.troveBeforeRedistribution),
            stabilityDeposit: this._updateIfChanged(equals, "stabilityDeposit", baseState.stabilityDeposit, baseStateUpdate.stabilityDeposit),
            remainingStabilityPoolZEROReward: this._silentlyUpdateIfChanged(eq, baseState.remainingStabilityPoolZEROReward, baseStateUpdate.remainingStabilityPoolZEROReward),
            _feesInNormalMode: this._silentlyUpdateIfChanged(equals, baseState._feesInNormalMode, baseStateUpdate._feesInNormalMode),
            zeroStake: this._updateIfChanged(equals, "zeroStake", baseState.zeroStake, baseStateUpdate.zeroStake),
            totalStakedZERO: this._updateIfChanged(eq, "totalStakedZERO", baseState.totalStakedZERO, baseStateUpdate.totalStakedZERO),
            _riskiestTroveBeforeRedistribution: this._silentlyUpdateIfChanged(equals, baseState._riskiestTroveBeforeRedistribution, baseStateUpdate._riskiestTroveBeforeRedistribution)
        };
    }
    _derive({ troveBeforeRedistribution, totalRedistributed, _feesInNormalMode, total, price, _riskiestTroveBeforeRedistribution }) {
        const fees = _feesInNormalMode._setRecoveryMode(total.collateralRatioIsBelowCritical(price));
        return {
            trove: troveBeforeRedistribution.applyRedistribution(totalRedistributed),
            fees,
            borrowingRate: fees.borrowingRate(),
            redemptionRate: fees.redemptionRate(),
            haveUndercollateralizedTroves: _riskiestTroveBeforeRedistribution
                .applyRedistribution(totalRedistributed)
                .collateralRatioIsBelowMinimum(price)
        };
    }
    _reduceDerived(derivedState, derivedStateUpdate) {
        return {
            fees: this._updateFees("fees", derivedState.fees, derivedStateUpdate.fees),
            trove: this._updateIfChanged(equals, "trove", derivedState.trove, derivedStateUpdate.trove),
            borrowingRate: this._silentlyUpdateIfChanged(eq, derivedState.borrowingRate, derivedStateUpdate.borrowingRate),
            redemptionRate: this._silentlyUpdateIfChanged(eq, derivedState.redemptionRate, derivedStateUpdate.redemptionRate),
            haveUndercollateralizedTroves: this._updateIfChanged(strictEquals, "haveUndercollateralizedTroves", derivedState.haveUndercollateralizedTroves, derivedStateUpdate.haveUndercollateralizedTroves)
        };
    }
    _notify(params) {
        // Iterate on a copy of `_listeners`, to avoid notifying any new listeners subscribed by
        // existing listeners, as that could result in infinite loops.
        //
        // Before calling a listener from our copy of `_listeners`, check if it has been removed from
        // the original set. This way we avoid calling listeners that have already been unsubscribed
        // by an earlier listener callback.
        [...this._listeners].forEach(listener => {
            if (this._listeners.has(listener)) {
                listener(params);
            }
        });
    }
    /**
     * Register a state change listener.
     *
     * @param listener - Function that will be called whenever state changes.
     * @returns Function to unregister this listener.
     */
    subscribe(listener) {
        const uniqueListener = wrap(listener);
        this._listeners.add(uniqueListener);
        return () => {
            this._listeners.delete(uniqueListener);
        };
    }
    /** @internal */
    _load(baseState, extraState) {
        assert_1.default(!this._loaded);
        this._baseState = baseState;
        this._derivedState = this._derive(baseState);
        this._extraState = extraState;
        this._loaded = true;
        this._scheduleUpdate();
        if (this.onLoaded) {
            this.onLoaded();
        }
    }
    /** @internal */
    _update(baseStateUpdate, extraStateUpdate) {
        assert_1.default(this._baseState && this._derivedState);
        const oldState = this.state;
        if (baseStateUpdate) {
            this._baseState = this._reduce(this._baseState, baseStateUpdate);
        }
        // Always running this lets us derive state based on passage of time, like baseRate decay
        this._derivedState = this._reduceDerived(this._derivedState, this._derive(this._baseState));
        if (extraStateUpdate) {
            assert_1.default(this._extraState);
            this._extraState = this._reduceExtra(this._extraState, extraStateUpdate);
        }
        this._scheduleUpdate();
        this._notify({
            newState: this.state,
            oldState,
            stateChange: difference(this.state, oldState)
        });
    }
}
exports.LiquityStore = LiquityStore;
//# sourceMappingURL=LiquityStore.js.map