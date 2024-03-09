import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';
import OverviewContent from './_overview.mdx';

const LogoIcon = require('@site/static/img/logo.svg').default;

export default function Home() {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        <FeaturesSection />
        <OverviewSection />

        <div className="container margin-vert--lg">
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get started
          </Link>
        </div>
      </main>
    </Layout>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <LogoIcon role="img" className={styles.heroLogo} />

        <Heading as="h1">Nrgy.js</Heading>

        <br />
        <br />
        <p className={styles.heroSubtitle}>Energy for reactive programming</p>

        <p>State and effect management, MVC and MVVM patterns</p>

        <div className={styles.buttons}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function FeaturesSection() {
  return (
    <section className={styles.features}>
      <div className="container">
        <h1>Features</h1>

        <div className="row margin--bottom--sm">
          <FeatureCard title="Easy to Use">
            <p>
              The library is designed to be easily installed and used to get
              your application up and running quickly
            </p>
          </FeatureCard>

          <FeatureCard title="Reactive state and effects">
            <p>
              Fully reactive state and effects using well-known concepts like{' '}
              <code>atoms</code> and <code>signals</code>
            </p>
          </FeatureCard>

          <FeatureCard title="Fast computations">
            <p>
              The efficient engine combines all computable nodes into a reactive
              graph
            </p>
          </FeatureCard>

          <FeatureCard title="Framework-agnostic Core">
            <p>
              It can be used by web and server applications, libraries and CLI
              tools
            </p>
          </FeatureCard>

          <FeatureCard title="MVVM and MVC patterns">
            <p>
              Bring business logic to the frontend with view models and
              controllers
            </p>
          </FeatureCard>

          <FeatureCard title="Ready for GC">
            <p>
              The loose coupling between internal parts allows automatic
              deletion of components that are no longer in use
            </p>
          </FeatureCard>

          <FeatureCard title="Developer-friendly API">
            <p>
              Functional programming and object-oriented programming are both
              supported
            </p>
          </FeatureCard>

          <FeatureCard title="Typescript typings">
            <p>
              The library is written in Typescript and provides type-checking
              and autocomplete for your code
            </p>
          </FeatureCard>

          <FeatureCard title="100% test coverage">
            <p>
              The library has been fully tested and has complete code coverage
            </p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, children }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card margin-bottom--md shadow--md">
        <div className="card__header">
          <h3>{title}</h3>
        </div>
        <div className="card__body">{children}</div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <section>
      <div className="container">
        <OverviewContent />
      </div>
    </section>
  );
}
