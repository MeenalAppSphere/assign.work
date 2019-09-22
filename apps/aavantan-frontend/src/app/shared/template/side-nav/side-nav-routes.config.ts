import { SideNavInterface } from '../../interfaces/side-nav.type';
export const ROUTES: SideNavInterface[] = [
  {
    path: './',
    title: 'Home',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'home',
    submenu: []
  },
  {
    path: 'project',
    title: 'Project',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'border',
    submenu: []
  },
  {
    path: 'board',
    title: 'Board',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'appstore',
    submenu: []
  },
  {
    path: 'active_sprint',
    title: 'Active Sprint',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'line-chart',
    submenu: []
  },
  {
    path: 'backlog',
    title: 'Backlog',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'snippets',
    submenu: []
  },
  {
    path: '',
    title: 'Settings',
    iconType: 'nzIcon',
    iconTheme: 'outline',
    icon: 'setting',
    submenu: [
      {
        path: 'settings/permissions',
        title: 'Permissions',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'security-scan',
        submenu: [],
        type:'admin'
      },
      {
        path: 'settings/collaborator',
        title: 'Collaborator',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'usergroup-add',
        submenu: [],
        type:'admin'
      }
    ]
  }
];
