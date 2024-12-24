declare module 'd3' {
  export function select(selector: string | Element): Selection<Element, unknown, null, undefined>;
  export function max<T>(array: T[], accessor: (d: T) => number): number | undefined;
  export function scaleBand<Domain = string>(): ScaleBand<Domain>;
  export function scaleLinear(): ScaleLinear<number, number>;
  export function axisBottom<Domain>(scale: ScaleBand<Domain> | ScaleLinear<number, number>): Axis<Domain>;
  export function axisLeft<Domain>(scale: ScaleBand<Domain> | ScaleLinear<number, number>): Axis<Domain>;

  export interface Selection<GElement extends Element | null = Element, Datum = unknown, PElement extends Element | null = null, PDatum = unknown> {
    append(type: string): Selection<Element, Datum, PElement, PDatum>;
    attr(name: string, value: string | number | boolean | ((d: Datum, i: number) => string | number | boolean)): this;
    selectAll(selector: string): Selection<Element, Datum, PElement, PDatum>;
    data<NewDatum>(data: NewDatum[]): Selection<Element, NewDatum, PElement, PDatum>;
    join(type: string): Selection<Element, Datum, PElement, PDatum>;
    text(value: string | number | ((d: Datum) => string | number)): this;
    call(fn: (selection: this) => void): this;
    remove(): this;
  }

  export interface ScaleBand<Domain> {
    (value: Domain): number;
    domain(domain: Domain[]): this;
    range(range: [number, number]): this;
    padding(padding: number): this;
    bandwidth(): number;
  }

  export interface ScaleLinear<Range = number, Output = number> {
    (value: number): number;
    domain(domain: [number, number]): this;
    range(range: [Range, Range]): this;
  }

  export interface Scale<Domain, Range> {
    (value: Domain): Range;
  }

  export interface Axis<Domain> {
    (selection: Selection): void;
    tickFormat(format: (d: Domain) => string): this;
    tickValues(values: Domain[]): this;
  }
}

declare module 'd3-time-format' {
  export function timeFormat(specifier: string): (date: Date) => string;
} 