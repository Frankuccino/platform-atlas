import type { Category } from './categories';
import type { Product } from './products';

export type { Category, Product };

/** Delivery model of a product. */
export type DeliveryModel = Product['model'];

/**
 * How one category sits on top of another.
 *
 * `runs-on` is the only kind authored here: the products in the source category
 * execute on top of the products in the target category. This is deliberately
 * conservative. A wrong edge teaches you something false about the market, so
 * edges are derived from category adjacency rather than invented.
 */
export type LayerEdgeKind = 'runs-on';

export interface LayerEdge {
  from: string;
  to: string;
  kind: LayerEdgeKind;
}

export interface Domain {
  id: string;
  name: string;
  /** Categories belonging to this domain, in display order. */
  categoryIds: string[];
}

/** Study status of a product for one user. */
export type StudyStatus = 'unseen' | 'learning' | 'known' | 'mastered';

/** Confidence in the current recall, 0 to 3. */
export type Confidence = 0 | 1 | 2 | 3;

/** A directed reference between two products. */
export type Edge = {
  from: string;
  to: string;
  kind: 'alternative';
};
