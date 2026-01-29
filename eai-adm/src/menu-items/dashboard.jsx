// assets (아이콘)
import { DashboardOutlined, GlobalOutlined, MonitorOutlined } from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  GlobalOutlined,
  MonitorOutlined
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'EAI 모니터링',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: '종합 대시보드',
      type: 'item',
      url: '/dashboard',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'interface-list',
      title: '인터페이스 관리',
      type: 'item',
      url: '/interface/list', // 나중에 이 페이지 만들면 됨
      icon: icons.GlobalOutlined
    },
    {
      id: 'transaction-log',
      title: '전문 거래 조회',
      type: 'item',
      url: '/transaction/log',
      icon: icons.MonitorOutlined
    }
  ]
};

export default dashboard;