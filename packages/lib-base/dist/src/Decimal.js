"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Percent = exports.Difference = exports.Decimal = void 0;
const assert_1 = __importDefault(require("assert"));
const bignumber_1 = require("@ethersproject/bignumber");
const getDigits = (numDigits) => TEN.pow(numDigits);
const MAX_UINT_256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
const PRECISION = 18;
const ONE = bignumber_1.BigNumber.from(1);
const TEN = bignumber_1.BigNumber.from(10);
const DIGITS = getDigits(PRECISION);
const stringRepresentationFormat = /^[0-9]*(\.[0-9]*)?(e[-+]?[0-9]+)?$/;
const trailingZeros = /0*$/;
const magnitudes = ["", "K", "M", "B", "T"];
const roundedMul = (x, y) => x.mul(y).add(Decimal.HALF.hex).div(DIGITS);
/**
 * Fixed-point decimal bignumber with 18 digits of precision.
 *
 * @remarks
 * Used by Liquity libraries to precisely represent native currency (e.g. Ether), ZUSD and ZERO
 * amounts, as well as derived metrics like collateral ratios.
 *
 * @public
 */
class Decimal {
    constructor(bigNumber) {
        if (bigNumber.isNegative()) {
            throw new Error("negatives not supported by Decimal");
        }
        this._bigNumber = bigNumber;
    }
    /** @internal */
    get hex() {
        return this._bigNumber.toHexString();
    }
    /** @internal */
    get bigNumber() {
        return this._bigNumber.toString();
    }
    static fromBigNumberString(bigNumberString) {
        return new Decimal(bignumber_1.BigNumber.from(bigNumberString));
    }
    static _fromString(representation) {
        if (!representation || !representation.match(stringRepresentationFormat)) {
            throw new Error(`bad decimal format: "${representation}"`);
        }
        if (representation.includes("e")) {
            // eslint-disable-next-line prefer-const
            let [coefficient, exponent] = representation.split("e");
            if (exponent.startsWith("-")) {
                return new Decimal(Decimal._fromString(coefficient)._bigNumber.div(TEN.pow(bignumber_1.BigNumber.from(exponent.substr(1)))));
            }
            if (exponent.startsWith("+")) {
                exponent = exponent.substr(1);
            }
            return new Decimal(Decimal._fromString(coefficient)._bigNumber.mul(TEN.pow(bignumber_1.BigNumber.from(exponent))));
        }
        if (!representation.includes(".")) {
            return new Decimal(bignumber_1.BigNumber.from(representation).mul(DIGITS));
        }
        // eslint-disable-next-line prefer-const
        let [characteristic, mantissa] = representation.split(".");
        if (mantissa.length < PRECISION) {
            mantissa += "0".repeat(PRECISION - mantissa.length);
        }
        else {
            mantissa = mantissa.substr(0, PRECISION);
        }
        return new Decimal(bignumber_1.BigNumber.from(characteristic || 0)
            .mul(DIGITS)
            .add(mantissa));
    }
    static from(decimalish) {
        switch (typeof decimalish) {
            case "object":
                if (decimalish instanceof Decimal) {
                    return decimalish;
                }
                else {
                    throw new Error("invalid Decimalish value");
                }
            case "string":
                return Decimal._fromString(decimalish);
            case "number":
                return Decimal._fromString(decimalish.toString());
            default:
                throw new Error("invalid Decimalish value");
        }
    }
    _toStringWithAutomaticPrecision() {
        const characteristic = this._bigNumber.div(DIGITS);
        const mantissa = this._bigNumber.mod(DIGITS);
        if (mantissa.isZero()) {
            return characteristic.toString();
        }
        else {
            const paddedMantissa = mantissa.toString().padStart(PRECISION, "0");
            const trimmedMantissa = paddedMantissa.replace(trailingZeros, "");
            return characteristic.toString() + "." + trimmedMantissa;
        }
    }
    _roundUp(precision) {
        const halfDigit = getDigits(PRECISION - 1 - precision).mul(5);
        return this._bigNumber.add(halfDigit);
    }
    _toStringWithPrecision(precision) {
        if (precision < 0) {
            throw new Error("precision must not be negative");
        }
        const value = precision < PRECISION ? this._roundUp(precision) : this._bigNumber;
        const characteristic = value.div(DIGITS);
        const mantissa = value.mod(DIGITS);
        if (precision === 0) {
            return characteristic.toString();
        }
        else {
            const paddedMantissa = mantissa.toString().padStart(PRECISION, "0");
            const trimmedMantissa = paddedMantissa.substr(0, precision);
            return characteristic.toString() + "." + trimmedMantissa;
        }
    }
    toString(precision) {
        if (this.infinite) {
            return "∞";
        }
        else if (precision !== undefined) {
            return this._toStringWithPrecision(precision);
        }
        else {
            return this._toStringWithAutomaticPrecision();
        }
    }
    prettify(precision = 2) {
        const [characteristic, mantissa] = this.toString(precision).split(".");
        const prettyCharacteristic = characteristic.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
        return mantissa !== undefined ? prettyCharacteristic + "." + mantissa : prettyCharacteristic;
    }
    shorten() {
        const characteristicLength = this.toString(0).length;
        const magnitude = Math.min(Math.floor((characteristicLength - 1) / 3), magnitudes.length - 1);
        const precision = Math.max(3 * (magnitude + 1) - characteristicLength, 0);
        const normalized = this.div(new Decimal(getDigits(PRECISION + 3 * magnitude)));
        return normalized.prettify(precision) + magnitudes[magnitude];
    }
    add(addend) {
        return new Decimal(this._bigNumber.add(Decimal.from(addend)._bigNumber));
    }
    sub(subtrahend) {
        return new Decimal(this._bigNumber.sub(Decimal.from(subtrahend)._bigNumber));
    }
    mul(multiplier) {
        return new Decimal(this._bigNumber.mul(Decimal.from(multiplier)._bigNumber).div(DIGITS));
    }
    div(divider) {
        divider = Decimal.from(divider);
        if (divider.isZero) {
            return Decimal.INFINITY;
        }
        return new Decimal(this._bigNumber.mul(DIGITS).div(divider._bigNumber));
    }
    /** @internal */
    _divCeil(divider) {
        divider = Decimal.from(divider);
        if (divider.isZero) {
            return Decimal.INFINITY;
        }
        return new Decimal(this._bigNumber.mul(DIGITS).add(divider._bigNumber.sub(ONE)).div(divider._bigNumber));
    }
    mulDiv(multiplier, divider) {
        multiplier = Decimal.from(multiplier);
        divider = Decimal.from(divider);
        if (divider.isZero) {
            return Decimal.INFINITY;
        }
        return new Decimal(this._bigNumber.mul(multiplier._bigNumber).div(divider._bigNumber));
    }
    pow(exponent) {
        assert_1.default(Number.isInteger(exponent));
        assert_1.default(0 <= exponent && exponent <= 0xffffffff); // Ensure we're safe to use bitwise ops
        if (exponent === 0) {
            return Decimal.ONE;
        }
        if (exponent === 1) {
            return this;
        }
        let x = this._bigNumber;
        let y = DIGITS;
        for (; exponent > 1; exponent >>>= 1) {
            if (exponent & 1) {
                y = roundedMul(x, y);
            }
            x = roundedMul(x, x);
        }
        return new Decimal(roundedMul(x, y));
    }
    get isZero() {
        return this._bigNumber.isZero();
    }
    get zero() {
        if (this.isZero) {
            return this;
        }
    }
    get nonZero() {
        if (!this.isZero) {
            return this;
        }
    }
    get infinite() {
        if (this.eq(Decimal.INFINITY)) {
            return this;
        }
    }
    get finite() {
        if (!this.eq(Decimal.INFINITY)) {
            return this;
        }
    }
    /** @internal */
    get absoluteValue() {
        return this;
    }
    lt(that) {
        return this._bigNumber.lt(Decimal.from(that)._bigNumber);
    }
    eq(that) {
        return this._bigNumber.eq(Decimal.from(that)._bigNumber);
    }
    gt(that) {
        return this._bigNumber.gt(Decimal.from(that)._bigNumber);
    }
    gte(that) {
        return this._bigNumber.gte(Decimal.from(that)._bigNumber);
    }
    lte(that) {
        return this._bigNumber.lte(Decimal.from(that)._bigNumber);
    }
    static min(a, b) {
        a = Decimal.from(a);
        b = Decimal.from(b);
        return a.lt(b) ? a : b;
    }
    static max(a, b) {
        a = Decimal.from(a);
        b = Decimal.from(b);
        return a.gt(b) ? a : b;
    }
}
exports.Decimal = Decimal;
Decimal.INFINITY = Decimal.fromBigNumberString(MAX_UINT_256);
Decimal.ZERO = Decimal.from(0);
Decimal.HALF = Decimal.from(0.5);
Decimal.ONE = Decimal.from(1);
/** @alpha */
class Difference {
    constructor(number) {
        this._number = number;
    }
    static between(d1, d2) {
        if (d1 === undefined || d2 === undefined) {
            return new Difference(undefined);
        }
        d1 = Decimal.from(d1);
        d2 = Decimal.from(d2);
        if (d1.infinite && d2.infinite) {
            return new Difference(undefined);
        }
        else if (d1.infinite) {
            return new Difference({ sign: "+", absoluteValue: d1 });
        }
        else if (d2.infinite) {
            return new Difference({ sign: "-", absoluteValue: d2 });
        }
        else if (d1.gt(d2)) {
            return new Difference({ sign: "+", absoluteValue: Decimal.from(d1).sub(d2) });
        }
        else if (d2.gt(d1)) {
            return new Difference({ sign: "-", absoluteValue: Decimal.from(d2).sub(d1) });
        }
        else {
            return new Difference({ sign: "", absoluteValue: Decimal.ZERO });
        }
    }
    toString(precision) {
        if (!this._number) {
            return "N/A";
        }
        return this._number.sign + this._number.absoluteValue.toString(precision);
    }
    prettify(precision) {
        if (!this._number) {
            return this.toString();
        }
        return this._number.sign + this._number.absoluteValue.prettify(precision);
    }
    mul(multiplier) {
        return new Difference(this._number && {
            sign: this._number.sign,
            absoluteValue: this._number.absoluteValue.mul(multiplier)
        });
    }
    get nonZero() {
        var _a;
        return ((_a = this._number) === null || _a === void 0 ? void 0 : _a.absoluteValue.nonZero) && this;
    }
    get positive() {
        var _a;
        return ((_a = this._number) === null || _a === void 0 ? void 0 : _a.sign) === "+" ? this : undefined;
    }
    get negative() {
        var _a;
        return ((_a = this._number) === null || _a === void 0 ? void 0 : _a.sign) === "-" ? this : undefined;
    }
    get absoluteValue() {
        var _a;
        return (_a = this._number) === null || _a === void 0 ? void 0 : _a.absoluteValue;
    }
    get infinite() {
        var _a;
        return ((_a = this._number) === null || _a === void 0 ? void 0 : _a.absoluteValue.infinite) && this;
    }
    get finite() {
        var _a;
        return ((_a = this._number) === null || _a === void 0 ? void 0 : _a.absoluteValue.finite) && this;
    }
}
exports.Difference = Difference;
/** @alpha */
class Percent {
    constructor(ratio) {
        this._percent = ratio.infinite || (ratio.mul && ratio.mul(100)) || ratio;
    }
    nonZeroish(precision) {
        var _a;
        const zeroish = `0.${"0".repeat(precision)}5`;
        if ((_a = this._percent.absoluteValue) === null || _a === void 0 ? void 0 : _a.gte(zeroish)) {
            return this;
        }
    }
    toString(precision) {
        return (this._percent.toString(precision) +
            (this._percent.absoluteValue && !this._percent.infinite ? "%" : ""));
    }
    prettify() {
        var _a, _b;
        if ((_a = this._percent.absoluteValue) === null || _a === void 0 ? void 0 : _a.gte("1000")) {
            return this.toString(0);
        }
        else if ((_b = this._percent.absoluteValue) === null || _b === void 0 ? void 0 : _b.gte("10")) {
            return this.toString(1);
        }
        else {
            return this.toString(2);
        }
    }
}
exports.Percent = Percent;
//# sourceMappingURL=Decimal.js.map