import LegalPage, { Section, SubSection, P } from './LegalPage'

export default function PrivacyPolicy({ setTab }) {
  return (
    <LegalPage title="Privacy Policy" effectiveDate="03/17/2026" setTab={setTab}>
      <P>Monmouth Made Mah Jongg™ ("we," "our," or "us") operates the website monmouthmademahjongg.com and the associated Progressive Web Application (collectively, the "Platform"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our Platform.</P>
      <P>By accessing or using the Platform, you agree to the terms of this Privacy Policy. If you do not agree, please do not use the Platform.</P>

      <Section number={1} title="Information We Collect">
        <SubSection number="1.1" title="Information You Provide Directly">
          <P>When you create an account or use the Platform, you may provide us with personal information including your name and display name, email address, phone number (if provided), profile photo (if uploaded), club or organization affiliations, and geographic location (city, town, or county for leaderboard placement).</P>
        </SubSection>
        <SubSection number="1.2" title="Game and Activity Data">
          <P>When you log games, interact with other players, or use Platform features, we collect game results and statistics (including wins, losses, hand details such as NMJL card section, line number, point value, self-pick status, jokerless status, and who threw the winning tile), Elo ratings and rank tier assignments, player rankings and achievement/badge data, game verification and confirmation records, club membership and participation history, tournament participation and results, and activity feed interactions.</P>
        </SubSection>
        <SubSection number="1.3" title="Community and Communication Data">
          <P>When you use the Platform's community features, we collect content you post on the community board (including text, images, and any other media), direct messages you send to and receive from other users, reports you submit about other users or content, and your interactions with community content (such as replies and reactions). Community board posts are visible to all Platform users. Direct messages are stored on our servers and are accessible to the sender and recipient(s). We may access direct message content when required by law, to enforce our Terms of Service, to investigate reports of abuse or violations, or to protect the safety of our users.</P>
        </SubSection>
        <SubSection number="1.4" title="Information Collected Automatically">
          <P>When you access the Platform, we may automatically collect device information (browser type, operating system, device model), IP address, usage data (pages viewed, features used, time spent on the Platform), cookies and similar tracking technologies (see our <span style={{ color: '#1e2b65', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setTab('cookies')}>Cookie Policy</span> for details), PWA installation and usage data, push notification interaction data, and referral source information.</P>
        </SubSection>
      </Section>

      <Section number={2} title="How We Use Your Information">
        <P>We use the information we collect to operate, maintain, and improve the Platform, including to create and manage your account and player profile; log and verify game results; calculate and display Elo rankings, rank tiers, and leaderboards; award badges and achievements based on your activity and performance; facilitate club management, roster administration, and organization features; operate tournament management tools including bracket generation and seeded pairings; display your profile, statistics, and community board posts to other Platform users; enable direct messaging between users; moderate community board content and enforce our content standards; send you push notifications about game verifications, achievements, ranking changes, community activity, and direct messages; send you transactional and promotional email communications; respond to your inquiries, reports, and customer support requests; analyze usage trends, detect fraud, and improve the Platform experience; process transactions for premium features or merchandise purchases; and comply with legal obligations.</P>
      </Section>

      <Section number={3} title="How We Share Your Information">
        <SubSection number="3.1" title="Public Information">
          <P>By design, certain information is visible to other Platform users. This includes your display name and profile photo, player profile and biography, Elo rating, rank tier, and ranking position, game history and statistics, badges and achievements earned, club affiliations, tournament participation and results, and community board posts and interactions. This public visibility is a core feature of the Platform that enables community engagement, leaderboards, competitive play, and social interaction.</P>
        </SubSection>
        <SubSection number="3.2" title="Direct Messages">
          <P>Direct messages are visible only to the sender and recipient(s). We do not share direct message content with other users. However, we may access direct message content as described in Section 1.3 of this Privacy Policy.</P>
        </SubSection>
        <SubSection number="3.3" title="Service Providers">
          <P>We may share your information with third-party service providers who assist us in operating the Platform, including hosting and infrastructure providers (such as Vercel and Supabase), analytics services (such as Google Analytics), email delivery services, push notification services, payment processors (if and when premium features or merchandise sales are introduced), and content moderation tools. These providers are contractually obligated to use your information only to perform services on our behalf and in compliance with applicable data protection laws.</P>
        </SubSection>
        <SubSection number="3.4" title="Legal Requirements">
          <P>We may disclose your information if required to do so by law, regulation, legal process, or governmental request, or when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others, investigate fraud or potential Terms of Service violations, or respond to a law enforcement request.</P>
        </SubSection>
        <SubSection number="3.5" title="Business Transfers">
          <P>If Monmouth Made Mah Jongg™ is involved in a merger, acquisition, or sale of all or a portion of its assets, your information may be transferred as part of that transaction. We will notify you via email or prominent notice on the Platform before your information becomes subject to a different privacy policy.</P>
        </SubSection>
      </Section>

      <Section number={4} title="Data Retention">
        <P>We retain your personal information for as long as your account is active or as needed to provide you services. Specific retention practices include the following: game data and statistics are retained to maintain the integrity of historical leaderboards, rankings, and other players' records; community board posts may be retained in anonymized form after account deletion to maintain the coherence of community discussions; direct messages are retained for the duration of both the sender's and recipient's active accounts, and may be deleted when either party deletes their account; achievement and badge data is retained alongside game records; and push notification and email communication logs are retained for up to 12 months for troubleshooting and analytics purposes.</P>
        <P>If you request deletion of your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal or legitimate business purposes. Anonymized game data may be retained to preserve the accuracy of other players' statistics and rankings.</P>
      </Section>

      <Section number={5} title="Your Rights and Choices">
        <P>Depending on your location, you may have certain rights regarding your personal information, including the right to access the personal information we hold about you, request correction of inaccurate information, request deletion of your account and personal data, object to or restrict certain processing of your data, request a portable copy of your data, withdraw consent where processing is based on consent, and opt out of promotional email communications.</P>
        <P>To exercise any of these rights, please contact us at the email address listed below. We will respond to your request within 30 days.</P>
      </Section>

      <Section number={6} title="Notifications and Communication Preferences">
        <SubSection number="6.1" title="Push Notifications">
          <P>If you install the Platform as a Progressive Web App and grant notification permissions, we may send push notifications to your device. You can manage or disable push notifications at any time through your device settings or the Platform's notification preferences page.</P>
        </SubSection>
        <SubSection number="6.2" title="Email Communications">
          <P>We send two types of email communications: transactional emails (account verification, password resets, game confirmations, and essential Platform updates) which are necessary for the operation of your account and cannot be opted out of; and promotional emails (new features, community updates, newsletters, and Platform news) which you may opt out of at any time using the unsubscribe link in any promotional email or through your account settings.</P>
        </SubSection>
      </Section>

      <Section number={7} title="Cookies and Tracking Technologies">
        <P>The Platform uses cookies and similar technologies as described in our separate <span style={{ color: '#1e2b65', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setTab('cookies')}>Cookie Policy</span>. Please refer to our Cookie Policy for detailed information about the types of cookies we use, their purposes, and your choices regarding cookies.</P>
      </Section>

      <Section number={8} title="Data Security">
        <P>We implement reasonable administrative, technical, and physical security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit (HTTPS/TLS), secure authentication and password hashing, access controls limiting who can view personal data, regular review of security practices, and secure storage of community board content and direct messages. However, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security of your information.</P>
      </Section>

      <Section number={9} title="Children's Privacy">
        <P>The Platform is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us and we will take steps to delete such information. Users between the ages of 13 and 18 may use the Platform with the consent of a parent or guardian. Users under 18 are not permitted to use the direct messaging feature to communicate with adults they do not know in person through their Mah Jongg club or organization participation.</P>
      </Section>

      <Section number={10} title="Third-Party Links and Services">
        <P>The Platform may contain links to third-party websites or services that are not operated by us, including links to external Mah Jongg resources, NMJL information, tournament listings, and merchandise providers. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party sites you visit.</P>
      </Section>

      <Section number={11} title="Changes to This Privacy Policy">
        <P>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on the Platform, updating the "Effective Date" at the top, and sending a push notification or email for significant changes. Your continued use of the Platform after any changes constitutes acceptance of the updated policy.</P>
      </Section>

      <Section number={12} title="California Privacy Rights (CCPA)">
        <P>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect and how it is used, the right to request deletion of your personal information, the right to opt out of the sale of your personal information (note: we do not sell personal information), and the right to non-discrimination for exercising your privacy rights. To exercise your CCPA rights, contact us at the email address listed below.</P>
      </Section>

      <Section number={13} title="Contact Us">
        <P>If you have any questions about this Privacy Policy, our data practices, or wish to exercise your privacy rights, please contact us at:</P>
        <P><strong>Monmouth Made Mah Jongg™</strong><br />
        Email: support@monmouthmademahjongg.com<br />
        Website: monmouthmademahjongg.com</P>
      </Section>
    </LegalPage>
  )
}