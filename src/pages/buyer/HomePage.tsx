import { Col, Row } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { api, unwrap } from '../../api/client';
import { ErrorAlert, Loading } from '../../components/Feedback';
import { Icon } from '../../components/Icon';
import { ProductCarousel } from '../../components/ProductCarousel';
import { useApi } from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export function HomePage() {
  useDocumentTitle(undefined);
  const { data, error, loading, reload } = useApi(() => unwrap(api.GET('/home')));

  return (
    <>
      <section className="hero mb-5">
        <img src="/images/hero-market.png" alt="" className="hero-image" />
        <div className="hero-copy">
          <h1 className="display-5">Find something made with care</h1>
          <p className="lead">Thousands of independent sellers. One cart.</p>
          <div>
            <Link to="/search" className="btn btn-warning btn-lg">
              Start shopping
            </Link>
          </div>
        </div>
      </section>

      {loading && <Loading />}
      {Boolean(error) && <ErrorAlert error={error} onRetry={reload} />}

      {data && (
        <>
          <Row className="g-2 mb-5 home-categories">
            {data.categories.map((c) => (
              <Col xs={6} md={3} lg={2} key={c.id}>
                <Link to={`/c/${c.slug}`} className="category-tile">
                  {c.name}
                </Link>
              </Col>
            ))}
          </Row>

          <ProductCarousel title="Today's deals" icon="tag" products={data.deals} moreLink="/search?sort=price_asc" />
          <ProductCarousel title="Trending now" icon="fire" products={data.trending} moreLink="/search?sort=popular" />
          <ProductCarousel title="New arrivals" icon="box" products={data.newArrivals} moreLink="/search?sort=newest" />
          <ProductCarousel title="Top rated" icon="star" products={data.topRated} moreLink="/search?sort=rating" />
        </>
      )}
    </>
  );
}
