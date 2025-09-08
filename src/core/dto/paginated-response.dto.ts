export class PaginationMetaDto {
  offset: number;
  limit: number;
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;

  constructor(offset: number, limit: number, total: number) {
    this.offset = offset;
    this.limit = limit;
    this.total = total;
    this.page = Math.floor(offset / limit) + 1;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = offset + limit < total;
    this.hasPrev = offset > 0;
  }
}

export class PaginatedResponseDto<T> {
  data: T[];
  pagination: PaginationMetaDto;

  constructor(data: T[], offset: number, limit: number, total: number) {
    this.data = data;
    this.pagination = new PaginationMetaDto(offset, limit, total);
  }
}
