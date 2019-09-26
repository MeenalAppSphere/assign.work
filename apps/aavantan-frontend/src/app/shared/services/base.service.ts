import { Store } from '@datorama/akita';

export class BaseService<S extends Store, St> {
  constructor(protected store: S) {
  }

  protected updateState(model: Partial<St>) {
    this.store.update((state) => {
      return {
        ...state,
        ...model
      };
    });
  }
}
