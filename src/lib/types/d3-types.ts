import type { Selection, ScaleBand, ScaleLinear } from 'd3';

// D3 Selection types
export type D3Selection<T extends SVGElement = SVGElement> = Selection<T, unknown, null, undefined>;
export type D3GroupSelection = Selection<SVGGElement, unknown, null, undefined>;
export type D3SVGSelection = Selection<SVGSVGElement, unknown, null, undefined>;

// D3 Scale types
export type D3ScaleBand = ScaleBand<string>;
export type D3ScaleLinear = ScaleLinear<number, number>;

// Chart group type
export interface ChartGroup {
  append: (tag: string) => D3Selection;
  selectAll: (selector: string) => D3Selection;
  select: (selector: string) => D3Selection;
  attr: (name: string, value: string | number | ((d: any) => string | number)) => ChartGroup;
  style: (name: string, value: string | number) => ChartGroup;
  on: (event: string, handler: Function) => ChartGroup;
}

// D3 Data types
export interface D3DataPoint {
  date: string;
  value: number;
  [key: string]: any;
}