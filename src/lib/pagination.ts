import { TPageQuery } from '@/types';

export class PageQuery {
  q?: string | null;
  page: number;
  take: number;

  constructor(opts: TPageQuery) {
    this.q = opts.q;
    this.page = +opts.page || 1;
    this.take = +opts.take || 20;
  }

  get skip() {
    return (this.page - 1) * this.take;
  }
}

export class PageMeta {
  public page: number;
  public total: number;
  public take: number;
  readonly totalPage: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;

  constructor(page: number, take: number, total: number) {
    this.page = page;
    this.total = total;
    this.take = take;
    this.totalPage = Math.ceil(this.total / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.totalPage;
  }
}
