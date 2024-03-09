import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import styles from './index.module.css';

const mountainIcon =
  require('@site/static/img/undraw_docusaurus_mountain.svg').default;
const treeIcon = require('@site/static/img/undraw_docusaurus_tree.svg').default;
const reactIcon =
  require('@site/static/img/undraw_docusaurus_react.svg').default;

function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Nrgy.js
        </Heading>

        <p className="hero__subtitle">Energy for reactive programming</p>

        <p>State and effect management, MVC and MVVM patterns</p>

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

function Feature({ Svg, title, children }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        {children}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Layout>
      <HomepageHeader />
      <main>
        <section className={styles.features}>
          <div className="container">
            <div className="row">
              <Feature title="Easy to Use" Svg={mountainIcon}>
                <p>
                  The library was designed to be easily installed and used to
                  get your application up and running quickly
                </p>
              </Feature>

              <Feature title="Fast computations" Svg={treeIcon}>
                <p>
                  The efficient computational engine combine all atoms and
                  signals in the reactive graph
                </p>
              </Feature>

              <Feature title="MVVM and MVC patterns" Svg={reactIcon}>
                <p>
                  Bring business logic to the frontend with view models and
                  controllers
                </p>
              </Feature>

              <Feature title="Framework-agnostic Core" Svg={mountainIcon}>
                <p>
                  It can be used by web and server applications, libraries and
                  CLI tools
                </p>
              </Feature>

              <Feature title="Developer-friendly API" Svg={treeIcon}></Feature>

              <Feature title="Typescript typings" Svg={reactIcon}></Feature>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
