import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import MDXContent from '@theme/MDXContent';
import styles from './index.module.css';
import OverviewContent from './_overview.mdx';
import UsageExampleContent from './_usage-example.mdx';

import LogoIcon from '@site/static/img/logo.svg';
import AddonExtensionIcon from '@site/static/icons/addon-extension-icon.svg';
import CheckMarkCircleLineIcon from '@site/static/icons/check-mark-circle-line-icon.svg';
import ProgrammerIcon from '@site/static/icons/programmer-icon.svg';
import ReloadSyncIcon from '@site/static/icons/reload-sync-icon.svg';
import RocketLaunchIcon from '@site/static/icons/rocket-launch-line-icon.svg';
import SpeedometerIcon from '@site/static/icons/speedometer-icon.svg';
import StructureDiagramIcon from '@site/static/icons/structure-diagram-icon.svg';
import TestingIcon from '@site/static/icons/testing-icon.svg';
import TypeingIcon from '@site/static/icons/typing-icon.svg';

export default function Home() {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        <OverviewSection />
        <FeaturesSection />
        <UsageExampleSection />

        <section>
          <div className="container margin-vert--lg">
            <Link
              className="button button--primary button--lg"
              to="/docs/introduction"
            >
              Get started
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function HomepageHeader() {
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <LogoIcon role="img" className={styles.heroLogo} />

        <Heading as="h1" className={styles.heroTitle}>
          Nrgy.js
        </Heading>

        <br />
        <br />
        <p className={styles.heroTagline}>Energy for reactive programming</p>

        <p className={styles.heroSubtitle}>
          State and effect management with MVC/MVVM patterns
        </p>

        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/introduction"
          >
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
          <FeatureCard title="Easy to Use" Icon={CheckMarkCircleLineIcon}>
            <p>
              The library is designed to be easily installed and used to get
              your application up and running quickly
            </p>
          </FeatureCard>

          <FeatureCard
            title="Reactive state and effects"
            Icon={RocketLaunchIcon}
          >
            <p>
              Fully reactive state and effects using well-known concepts like{' '}
              <code>atoms</code> and <code>signals</code>
            </p>
          </FeatureCard>

          <FeatureCard title="Fast computations" Icon={SpeedometerIcon}>
            <p>
              The efficient engine combines all computable nodes into a reactive
              graph
            </p>
          </FeatureCard>

          <FeatureCard
            title="Framework-agnostic Core"
            Icon={AddonExtensionIcon}
          >
            <p>
              It can be used by web and server applications, libraries and CLI
              tools
            </p>
          </FeatureCard>

          <FeatureCard
            title="MVVM and MVC patterns"
            Icon={StructureDiagramIcon}
          >
            <p>
              Bring business logic to the frontend with view models and
              controllers
            </p>
          </FeatureCard>

          <FeatureCard title="Ready for GC" Icon={ReloadSyncIcon}>
            <p>
              The loose coupling between internal parts allows automatic
              deletion of components that are no longer in use
            </p>
          </FeatureCard>

          <FeatureCard title="Developer-friendly API" Icon={ProgrammerIcon}>
            <p>
              Functional programming and object-oriented programming are both
              supported
            </p>
          </FeatureCard>

          <FeatureCard title="Type-safety" Icon={TypeingIcon}>
            <p>
              The library is written in Typescript and provides type-checking
              and autocomplete for your code
            </p>
          </FeatureCard>

          <FeatureCard title="100% test coverage" Icon={TestingIcon}>
            <p>
              The library has been fully tested and has complete code coverage
            </p>
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, Icon, children }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="card margin-bottom--md shadow--md">
        <div className="card__header">
          <h3>{title}</h3>
        </div>
        <div className="card__body">
          {Icon && (
            <Icon
              className="margin-left--md margin-bottom--md"
              style={{
                float: 'right',
                fill: '#808080',
                width: '32px',
                height: '32px',
              }}
            />
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

function OverviewSection() {
  return (
    <section>
      <div className="container">
        <MDXContent>
          <OverviewContent />
        </MDXContent>
      </div>
    </section>
  );
}

function UsageExampleSection() {
  return (
    <section>
      <div className="container">
        <MDXContent>
          <UsageExampleContent />
        </MDXContent>
      </div>
    </section>
  );
}
