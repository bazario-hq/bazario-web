import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import { Footer } from './Footer';
import { Header } from './Header';
import { ShippingBanner } from './ShippingBanner';
import { Toasts } from './Toasts';

export function Layout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      <ShippingBanner />
      <main className="flex-grow-1 py-4">
        <Container>
          <Outlet />
        </Container>
      </main>
      <Footer />
      <Toasts />
    </div>
  );
}
