import LegalPage, { Section, SubSection, P } from './LegalPage'

export default function CookiePolicy({ setTab }) {
  const cellStyle = { padding: '10px 12px', borderBottom: '0.5px solid #c8cdd6', fontSize: 12.5, verticalAlign: 'top' }
  const headerStyle = { ...cellStyle, background: '#1e2b65', color: '#fff', fontWeight: 700, fontSize: 12, letterSpacing: 0.5 }

  return (
    <LegalPage title="Cookie Policy" effectiveDate="03/17/2026" setTab={setTab}>
      <P>Monmouth Made Mah Jongg™ ("we," "our," or "us") uses cookies and similar tracking technologies on monmouthmademahjongg.com and the associated Progressive Web Application (collectively, the "Platform"). This Cookie Policy explains what cookies are, how we use them, and your choices regarding their use.</P>
      <P>This policy should be read together with our <span style={{ color: '#1e2b65', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setTab('privacy')}>Privacy Policy</span>, which provides additional detail on how we collect and use personal information.</P>

      <Section number={1} title="What Are Cookies?">
        <P>Cookies are small text files that are stored on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work efficiently, provide a better user experience, and give website operators information about how their site is being used.</P>
        <P>Similar technologies include local storage, session storage, and pixel tags (also known as web beacons or clear GIFs), which function in comparable ways. When we refer to "cookies" in this policy, we include these similar technologies.</P>
      </Section>

      <Section number={2} title="Types of Cookies We Use">
        <P>The following table describes the categories of cookies used on the Platform:</P>
        <div style={{ overflowX: 'auto', margin: '12px 0 16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '0.5px solid #c8cdd6', borderRadius: 6 }}>
            <thead>
              <tr>
                <th style={{ ...headerStyle, width: '15%' }}>Category</th>
                <th style={{ ...headerStyle, width: '30%' }}>Purpose</th>
                <th style={{ ...headerStyle, width: '30%' }}>Examples</th>
                <th style={{ ...headerStyle, width: '25%' }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ ...cellStyle, fontWeight: 600 }}>Essential</td>
                <td style={cellStyle}>Required for the Platform to function. These enable core features like authentication, security, session management, and real-time communication.</td>
                <td style={cellStyle}>Login session tokens, CSRF protection tokens, cookie consent preferences, WebSocket connection state for messaging</td>
                <td style={cellStyle}>Session or up to 1 year</td>
              </tr>
              <tr style={{ background: '#fafaf8' }}>
                <td style={{ ...cellStyle, fontWeight: 600 }}>Functional</td>
                <td style={cellStyle}>Remember your preferences and settings to enhance your experience across game logging, community features, and notifications.</td>
                <td style={cellStyle}>Language preferences, display settings, recently used tables, notification preferences, community board view settings, PWA state</td>
                <td style={cellStyle}>Up to 1 year</td>
              </tr>
              <tr>
                <td style={{ ...cellStyle, fontWeight: 600 }}>Analytics</td>
                <td style={cellStyle}>Help us understand how visitors use the Platform so we can improve it, including which features are most popular and how community engagement flows.</td>
                <td style={cellStyle}>Google Analytics (or similar), page view tracking, feature usage metrics, community board engagement analytics</td>
                <td style={cellStyle}>Up to 2 years</td>
              </tr>
              <tr style={{ background: '#fafaf8' }}>
                <td style={{ ...cellStyle, fontWeight: 600 }}>Performance</td>
                <td style={cellStyle}>Monitor Platform performance, detect errors, and optimize load times across all features including real-time messaging and notifications.</td>
                <td style={cellStyle}>Error logging, page load timing, API response monitoring, push notification delivery metrics</td>
                <td style={cellStyle}>Session or up to 1 year</td>
              </tr>
            </tbody>
          </table>
        </div>
        <P>We do not use advertising or marketing cookies. The Platform does not serve ads and does not use cookies to track you across other websites.</P>
      </Section>

      <Section number={3} title="First-Party vs. Third-Party Cookies">
        <P>First-party cookies are set by us directly when you visit the Platform. These include essential and functional cookies that enable the Platform to operate properly, maintain your login session, and remember your preferences for features like game logging and community board settings.</P>
        <P>Third-party cookies are set by external services that we integrate into the Platform. Currently, these may include analytics providers (such as Google Analytics) to help us understand usage patterns, hosting and infrastructure providers (such as Vercel and Supabase) that may set cookies for performance and security purposes, and push notification services that may use cookies to manage notification delivery. We review third-party cookies regularly and only use services that handle data responsibly.</P>
      </Section>

      <Section number={4} title="Your Choices and Controls">
        <SubSection number="4.1" title="Cookie Consent Banner">
          <P>When you first visit the Platform, you will see a cookie consent banner that allows you to accept or customize your cookie preferences. Essential cookies cannot be disabled as they are necessary for the Platform to function, including features like authentication, game logging, and the community board. You may decline non-essential cookies (analytics, performance) through the banner.</P>
        </SubSection>
        <SubSection number="4.2" title="Browser Settings">
          <P>Most web browsers allow you to manage cookies through their settings. You can typically set your browser to block all cookies, block only third-party cookies, clear cookies when you close the browser, or be notified when a cookie is set. Please note that blocking or deleting cookies may affect the functionality of the Platform. For example, you may need to log in again, your preferences may not be saved, or certain real-time features like notifications and messaging may not function properly.</P>
        </SubSection>
        <SubSection number="4.3" title="Opt-Out Links">
          <P>If we use Google Analytics, you can opt out by installing the Google Analytics Opt-out Browser Add-on, available at tools.google.com/dlpage/gaoptout. You can also update your cookie preferences at any time through the cookie settings link in the Platform footer.</P>
        </SubSection>
      </Section>

      <Section number={5} title="Data Collected Through Cookies">
        <P>The information collected through cookies may include your IP address and approximate geographic location, browser type, operating system, and device information, pages visited and features used on the Platform (including game logging, rankings, community board, and direct messaging), time and date of your visits, referring URLs (how you arrived at the Platform), interactions with Platform features (such as buttons clicked, forms submitted, and notifications interacted with), and PWA installation and offline usage data.</P>
        <P>This data is used in aggregate to understand usage patterns and improve the Platform. We do not use cookie data to identify individual users for advertising purposes.</P>
      </Section>

      <Section number={6} title="How Long Do Cookies Last?">
        <P>Session cookies are temporary and are deleted when you close your browser. Persistent cookies remain on your device for a set period (as described in the table above) or until you manually delete them. You can view and delete cookies stored on your device through your browser settings at any time.</P>
      </Section>

      <Section number={7} title="Updates to This Cookie Policy">
        <P>We may update this Cookie Policy from time to time to reflect changes in the cookies we use or for legal, regulatory, or operational reasons. We will post the updated policy on the Platform and update the "Effective Date" at the top. We encourage you to review this policy periodically.</P>
      </Section>

      <Section number={8} title="Contact Us">
        <P>If you have questions about this Cookie Policy or our use of cookies, please contact us at:</P>
        <P><strong>Monmouth Made Mah Jongg™</strong><br />
        Email: support@monmouthmademahjongg.com<br />
        Website: monmouthmademahjongg.com</P>
      </Section>
    </LegalPage>
  )
}