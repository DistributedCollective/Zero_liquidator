/**
 * Types that can be converted into a Decimal.
 *
 * @public
 */
export declare type Decimalish = Decimal | number | string;
/**
 * Fixed-point decimal bignumber with 18 digits of precision.
 *
 * @remarks
 * Used by Liquity libraries to precisely represent native currency (e.g. Ether), ZUSD and ZERO
 * amounts, as well as derived metrics like collateral ratios.
 *
 * @public
 */
export declare class Decimal {
    static readonly INFINITY: Decimal;
    static readonly ZERO: Decimal;
    static readonly HALF: Decimal;
    static readonly ONE: Decimal;
    private readonly _bigNumber;
    /** @internal */
    get hex(): string;
    /** @internal */
    get bigNumber(): string;
    private constructor();
    static fromBigNumberString(bigNumberString: string): Decimal;
    private static _fromString;
    static from(decimalish: Decimalish): Decimal;
    private _toStringWithAutomaticPrecision;
    private _roundUp;
    private _toStringWithPrecision;
    toString(precision?: number): string;
    prettify(precision?: number): string;
    shorten(): string;
    add(addend: Decimalish): Decimal;
    sub(subtrahend: Decimalish): Decimal;
    mul(multiplier: Decimalish): Decimal;
    div(divider: Decimalish): Decimal;
    /** @internal */
    _divCeil(divider: Decimalish): Decimal;
    mulDiv(multiplier: Decimalish, divider: Decimalish): Decimal;
    pow(exponent: number): Decimal;
    get isZero(): boolean;
    get zero(): this | undefined;
    get nonZero(): this | undefined;
    get infinite(): this | undefined;
    get finite(): this | undefined;
    /** @internal */
    get absoluteValue(): this;
    lt(that: Decimalish): boolean;
    eq(that: Decimalish): boolean;
    gt(that: Decimalish): boolean;
    gte(that: Decimalish): boolean;
    lte(that: Decimalish): boolean;
    static min(a: Decimalish, b: Decimalish): Decimal;
    static max(a: Decimalish, b: Decimalish): Decimal;
}
/** @alpha */
export declare class Difference {
    private _number?;
    private constructor();
    static between(d1: Decimalish | undefined, d2: Decimalish | undefined): Difference;
    toString(precision?: number): string;
    prettify(precision?: number): string;
    mul(multiplier: Decimalish): Difference;
    get nonZero(): this | undefined;
    get positive(): this | undefined;
    get negative(): this | undefined;
    get absoluteValue(): Decimal | undefined;
    get infinite(): this | undefined;
    get finite(): this | undefined;
}
/** @alpha */
export declare class Percent<T extends {
    infinite?: T | undefined;
    absoluteValue?: A | undefined;
    mul?(hundred: 100): T;
    toString(precision?: number): string;
}, A extends {
    gte(n: string): boolean;
}> {
    private _percent;
    constructor(ratio: T);
    nonZeroish(precision: number): this | undefined;
    toString(precision: number): string;
    prettify(): string;
}
//# sourceMappingURL=Decimal.d.ts.map