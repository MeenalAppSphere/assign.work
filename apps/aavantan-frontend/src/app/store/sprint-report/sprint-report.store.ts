import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';

export interface SprintReportState {
  getSprintReportInProcess: boolean;
}

const initialState: SprintReportState = {
  getSprintReportInProcess: false
};

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'sprint-report', resettable: true })

export class SprintReportStore extends Store<SprintReportState> {

  constructor() {
    super(initialState);
  }

}
