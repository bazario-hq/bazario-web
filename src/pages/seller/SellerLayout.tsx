import { Col, Nav, Row } from 'react-bootstrap';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon, type IconName } from '../../components/Icon';
import { useApp } from '../../context/AppContext';

const LINKS: [string, string, IconName][] = [
  ['/seller/products', 'Products', 'box'],
  ['/seller/orders', 'Orders', 'truck'],
];

export function SellerLayout() {
  const { user } = useApp();
  return (
    <Row className="g-4">
      <Col md={3} lg={2}>
        <div className="small text-muted mb-2">{user?.seller?.storeName}</div>
        <Nav className="flex-column seller-nav" variant="pills" aria-label="Seller navigation">
          {LINKS.map(([to, label, icon]) => (
            <Nav.Link as={NavLink} to={to} end={to === '/seller'} key={to}>
              <Icon name={icon} className="me-2" />
              {label}
            </Nav.Link>
          ))}
        </Nav>
      </Col>
      <Col md={9} lg={10}>
        <Outlet />
      </Col>
    </Row>
  );
}
