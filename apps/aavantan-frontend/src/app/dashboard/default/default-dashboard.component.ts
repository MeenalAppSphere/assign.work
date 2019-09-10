import { Component } from '@angular/core'
import { ThemeConstantService } from '../../shared/services/theme-constant.service';

@Component({
    templateUrl: './default-dashboard.component.html'
})

export class DefaultDashboardComponent {

    themeColors = this.colorConfig.get().colors;


    constructor( private colorConfig:ThemeConstantService ) {}

}  
