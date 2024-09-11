import { Col, Container, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer mt-5 py-4">
      <Container>
        <Row className="small">
          <Col md={4}>
            <div className="brand h5">Bazario</div>
            <p className="text-muted">Independent sellers, one marketplace.</p>
          </Col>
          <Col md={4}>
            <ul className="list-unstyled">
              <li>
                <Link to="/search">All products</Link>
              </li>
              <li>
                <Link to="/sell">Sell on Bazario</Link>
              </li>
            </ul>
          </Col>
          <Col md={4} className="text-md-end text-muted">
            © {new Date().getFullYear()} Bazario Ltd.
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
