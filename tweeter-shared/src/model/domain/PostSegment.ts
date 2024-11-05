import { PostSegmentDto } from "../dto/PostSegmentDto";

export enum Type {
  text = "Text",
  alias = "Alias",
  url = "URL",
  newline = "Newline",
}

export class PostSegment {
  private _text: string;
  private _startPostion: number;
  private _endPosition: number;
  private _type: Type;

  public constructor(
    text: string,
    startPosition: number,
    endPosition: number,
    type: Type
  ) {
    this._text = text;
    this._startPostion = startPosition;
    this._endPosition = endPosition;
    this._type = type;
  }

  public get text(): string {
    return this._text;
  }

  public get startPostion(): number {
    return this._startPostion;
  }

  public get endPosition(): number {
    return this._endPosition;
  }

  public get type(): Type {
    return this._type;
  }

  // Helper functions need to handle the DTOs
  // -----------------------------------------------------------
  // Converts PostSegment to PostSegmentDto
  public toDto(): PostSegmentDto {
    return {
      content: this._text,
      startPosition: this._startPostion,
      endPosition: this._endPosition,
      type: this._type,
    };
  }

  // Getter function for the Dto
  public get dto(): PostSegmentDto {
    return this.toDto();
  }

  // Converts PostSegmentDto to PostSegment
  public static fromDto(dto: PostSegmentDto): PostSegment {
    return new PostSegment(
      dto.content,
      dto.startPosition,
      dto.endPosition,
      dto.type
    );
  }
  // -----------------------------------------------------------
}
