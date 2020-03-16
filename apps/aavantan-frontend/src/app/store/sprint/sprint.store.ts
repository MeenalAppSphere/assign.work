import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface SprintState {
  getSprintInProcess: boolean;
}

const initialState: SprintState = {
  getSprintInProcess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'sprint', resettable: true })

export class SprintStore extends Store<SprintState> {

  constructor() {
    super(initialState);
  }

}
