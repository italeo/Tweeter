import { Type } from "../domain/PostSegment";

export interface PostSegmentDto {
  readonly content: string;
  readonly startPosition: number;
  readonly endPosition: number;
  readonly type: Type;
}
