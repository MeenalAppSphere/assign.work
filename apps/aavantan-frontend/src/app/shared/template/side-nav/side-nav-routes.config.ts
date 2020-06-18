import { SideNavInterface } from '../../interfaces/side-nav.type';
export const ROUTES: SideNavInterface[] = [
  {
    path: './',
    title: 'Home',
    iconType: '',
    iconTheme: 'outline',
    icon: 'home',
    img: 'menu-home',
    submenu: []
  },
  {
    path: 'my-tasks',
    title: 'My Tasks',
    iconType: '',
    iconTheme: 'outline',
    icon: 'border',
    img: 'menu-project',
    submenu: []
  },
  {
    path: 'running-sprint',
    title: 'Running Sprint',
    iconType: '',
    iconTheme: 'outline',
    icon: 'appstore',
    img: 'menu-active-sprint',
    submenu: []
  },
  {
    path: 'plan-sprint',
    title: 'Plan Work/Sprint',
    iconType: '',
    iconTheme: 'outline',
    icon: 'snippets',
    img: 'menu-backlogs',
    submenu: []
  },
  {
    path: 'backlog',
    title: 'Backlog',
    iconType: '',
    iconTheme: 'outline',
    icon: 'snippets',
    img: 'menu-backlogs',
    submenu: []
  },
  {
    path: 'settings',
    title: 'Settings',
    iconType: '',
    iconTheme: 'outline',
    icon: 'settings',
    img: 'menu-settings',
    submenu: []
  },
  {
    path: '',
    title: 'Settings',
    iconType: '',
    iconTheme: 'outline',
    icon: 'setting',
    img: 'menu-settings',
    type:'admin',
    submenu: [
      {
        path: 'settings/permissions',
        title: 'Permissions',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'security-scan',
        img: 'backlogs.svg',
        submenu: [],
        type:'admin'
      },
      {
        path: 'settings/collaborator',
        title: 'Collaborator',
        iconType: 'nzIcon',
        iconTheme: 'outline',
        icon: 'usergroup-add',
        img: 'backlogs.svg',
        submenu: [],
        type:'admin'
      }
    ]
  }
];
