import Heading from '@theme/Heading';
import clsx from 'clsx';

import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        The library was designed to be easily installed and used to get your
        application up and running quickly.
      </>
    ),
  },
  {
    title: 'Fast computations',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        The efficient computational engine combine all atoms and signals in the
        reactive graph
      </>
    ),
  },
  {
    title: 'MVVM and MVC patterns',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>Bring business logic to the frontend with view models and controllers</>
    ),
  },

  {
    title: 'Framework-agnostic Core',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        It can be used by web and server applications, libraries and CLI tools
      </>
    ),
  },
  {
    title: 'Developer-friendly API',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    // description: (
    //   <>
    //     The efficient computational engine combine all atoms and signals in the
    //     reactive graph
    //   </>
    // ),
  },
  {
    title: 'Typescript typings',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    // description: (
    //   <>Bring business logic to the frontend with view models and controllers</>
    // ),
  },
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}