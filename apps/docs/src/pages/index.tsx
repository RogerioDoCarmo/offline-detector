import type { ReactElement } from 'react';
import Link from '@docusaurus/Link';
import Translate, { translate } from '@docusaurus/Translate';
import Layout from '@theme/Layout';
import SignalArc from '../components/SignalArc';

const DEMO_URL = 'https://rogeriodocarmo.github.io/offline-detector/demo/';

export default function Home(): ReactElement {
  return (
    <Layout
      title={translate({ id: 'home.meta.title', message: 'No internet, said calmly' })}
      description={translate({
        id: 'home.meta.description',
        message:
          'Show when a React or React Native app has no internet: a snackbar, a banner and an indicator, accessible and translated.',
      })}
    >
      <header className="sf-hero">
        <div className="container sf-hero__inner">
          <div>
            <h1 className="sf-hero__title">
              <Translate id="home.title">
                Know when the connection is lost. And found.
              </Translate>
            </h1>
            <p className="sf-hero__lead">
              <Translate id="home.lead">
                offline-detector shows when a React or React Native app has no internet,
                with short, calm messages that look like the host app and are accessible
                by default.
              </Translate>
            </p>
            <div className="sf-hero__actions">
              <Link className="button button--primary button--lg" to="/docs/install/">
                <Translate id="home.cta.start">Get started</Translate>
              </Link>
              <Link className="button button--secondary button--lg" href={DEMO_URL}>
                <Translate id="home.cta.demo">Open the live demo</Translate>
              </Link>
            </div>
          </div>
          <SignalArc />
        </div>
      </header>
      <main className="sf-states">
        <div className="container">
          <h2 className="sf-states__heading">
            <Translate id="home.states.heading">Three ways to have no internet</Translate>
          </h2>
          <div className="sf-states__grid">
            <section className="sf-state sf-state--lost">
              <h3>
                <Translate id="home.states.interface.title">
                  No network connection
                </Translate>
              </h3>
              <p>
                <Translate id="home.states.interface.body">
                  Airplane mode, Wi-Fi off, no cable. The device tells us at once.
                </Translate>
              </p>
            </section>
            <section className="sf-state sf-state--lost">
              <h3>
                <Translate id="home.states.internet.title">
                  Connected, but no internet
                </Translate>
              </h3>
              <p>
                <Translate id="home.states.internet.body">
                  Wi-Fi with a captive portal or a dead router. A small probe notices what
                  the device cannot.
                </Translate>
              </p>
            </section>
            <section className="sf-state">
              <h3>
                <Translate id="home.states.online.title">Back online</Translate>
              </h3>
              <p>
                <Translate id="home.states.online.body">
                  One calm confirmation for a few seconds, never at launch, then it gets
                  out of the way.
                </Translate>
              </p>
            </section>
          </div>
        </div>
      </main>
    </Layout>
  );
}
