import LegalPage, { Section, SubSection, P } from './LegalPage'

export default function TermsOfService({ setTab }) {
  return (
    <LegalPage title="Terms of Service" effectiveDate="03/17/2026" setTab={setTab}>
      <P>Welcome to Monmouth Made Mah Jongg™. These Terms of Service ("Terms") govern your access to and use of the website located at monmouthmademahjongg.com and the associated Progressive Web Application (collectively, the "Platform"), operated by Monmouth Made Mah Jongg™ ("we," "our," or "us").</P>
      <P>By creating an account or using the Platform, you agree to be bound by these Terms. If you do not agree, do not use the Platform.</P>

      <Section number={1} title="Eligibility">
        <P>You must be at least 13 years of age to use the Platform. If you are between 13 and 18 years of age, you may only use the Platform with the consent and supervision of a parent or legal guardian. By using the Platform, you represent and warrant that you meet these eligibility requirements.</P>
      </Section>

      <Section number={2} title="Account Registration">
        <P>To access certain features of the Platform, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that contain inaccurate information or that we reasonably believe have been compromised.</P>
        <P>By creating an account, you acknowledge and agree to these Terms of Service, our Privacy Policy, and our Cookie Policy.</P>
      </Section>

      <Section number={3} title="Use of the Platform">
        <SubSection number="3.1" title="Permitted Use">
          <P>The Platform is provided for personal, non-commercial use to log Mah Jongg game results, track statistics and rankings, participate in clubs and organizations, earn achievements and badges, communicate with other players through the community board and direct messaging features, participate in tournaments, and engage with the Mah Jongg community. You may use the Platform only in accordance with these Terms and all applicable laws and regulations.</P>
        </SubSection>
        <SubSection number="3.2" title="Prohibited Conduct">
          <P>You agree not to use the Platform to submit false, fraudulent, or misleading game results or statistics; manipulate Elo ratings, rankings, or leaderboards through collusion, fake accounts, or other deceptive means; impersonate any person or entity, or misrepresent your affiliation with any person or entity; harass, bully, intimidate, stalk, or threaten other users, whether through the community board, direct messages, or any other Platform feature; upload or transmit any content that is unlawful, harmful, defamatory, obscene, hateful, discriminatory, or otherwise objectionable; post spam, unsolicited advertisements, or promotional material on the community board or through direct messages; solicit personal information from other users for purposes unrelated to Mah Jongg community participation; attempt to gain unauthorized access to the Platform, other users' accounts, or any systems or networks connected to the Platform; use automated scripts, bots, or scrapers to access or interact with the Platform; interfere with or disrupt the Platform or the servers or networks connected to it; use the Platform for any commercial purpose without our prior written consent; or circumvent any content moderation, filtering, or blocking measures implemented by us.</P>
        </SubSection>
      </Section>

      <Section number={4} title="Community Board and Direct Messaging">
        <SubSection number="4.1" title="User-Generated Content on the Community Board">
          <P>The Platform includes a community board where users can post messages, share updates, discuss Mah Jongg topics, and interact with other members of the community. The Platform also provides direct messaging functionality that allows users to communicate privately with one another. You are solely responsible for the content you post on the community board and the messages you send through direct messaging. We do not endorse, verify, or guarantee the accuracy, completeness, or reliability of any content posted by users.</P>
        </SubSection>
        <SubSection number="4.2" title="Content Standards">
          <P>All content posted to the community board or sent through direct messages must comply with these Terms and all applicable laws. You agree not to post or send content that is defamatory, libelous, or fraudulent; contains hate speech, threats of violence, or harassment directed at any individual or group; is sexually explicit, pornographic, or exploitative; infringes on the intellectual property rights of any third party, including copyrighted material, trademarks, or trade secrets; contains personal or confidential information about another person without their consent; promotes illegal activity or provides instructions for illegal conduct; contains malware, viruses, or harmful code; or is intended to deceive, mislead, or defraud other users.</P>
        </SubSection>
        <SubSection number="4.3" title="Content Moderation and Removal">
          <P>We reserve the right, but are not obligated, to monitor, review, edit, or remove any content posted on the community board or transmitted through direct messages at our sole discretion, with or without notice. We may remove content that we reasonably believe violates these Terms, is harmful to other users, or is otherwise objectionable. We may also suspend or terminate the accounts of users who repeatedly violate these content standards or who engage in a pattern of abusive behavior.</P>
        </SubSection>
        <SubSection number="4.4" title="Reporting Objectionable Content">
          <P>If you encounter content on the community board or through direct messaging that you believe violates these Terms or is otherwise objectionable, you may report it using the reporting tools provided on the Platform or by contacting us at the email address listed below. We will review reported content and take appropriate action, which may include removing the content, issuing warnings, or suspending or terminating the offending user's account. We will endeavor to review reports promptly but cannot guarantee specific response times.</P>
        </SubSection>
        <SubSection number="4.5" title="No Liability for User Content">
          <P>We are not responsible or liable for any content posted, stored, or transmitted by users on the community board or through direct messages. We do not pre-screen user content and make no representations or warranties regarding the accuracy, quality, safety, or legality of user-generated content. You acknowledge that by using the community board and direct messaging features, you may be exposed to content that you find offensive, objectionable, or inaccurate, and you agree that we shall not be liable for any such content. Your interactions with other users, including any disputes arising from community board posts or direct messages, are solely between you and the other user(s) involved. We are not a party to such disputes and have no obligation to mediate or resolve them.</P>
        </SubSection>
        <SubSection number="4.6" title="License to User Content">
          <P>By posting content on the community board, you grant us a non-exclusive, worldwide, royalty-free, perpetual, irrevocable license to use, display, reproduce, modify, adapt, and distribute such content in connection with operating, promoting, and improving the Platform. You retain ownership of the content you post but acknowledge that community board content may be visible to all Platform users. Content sent through direct messages is treated as private between the sender and recipient(s), except where disclosure is required by law, necessary to enforce these Terms, or needed to protect the safety of users.</P>
        </SubSection>
      </Section>

      <Section number={5} title="Game Logging and Verification">
        <P>The Platform allows users to log Mah Jongg game results and tracks statistics based on user-submitted data. Each game record may include the four players at the table, the winner (or designation of a wall game), the winning hand details including the NMJL card section, line number, and point value, whether the hand was self-picked or won off a discard, jokerless status, and who threw the winning tile. Game results are subject to a verification system requiring confirmation from at least one other player at the table. Unverified games are marked as pending and may auto-verify after 48 hours if no dispute is filed. We do not guarantee the accuracy of user-submitted game data. We reserve the right to remove or modify game records that we reasonably believe to be fraudulent, inaccurate, or submitted in violation of these Terms.</P>
      </Section>

      <Section number={6} title="Elo Ratings and Rankings">
        <P>Player Elo ratings are calculated using a proprietary algorithm based on game results submitted through the Platform. Ratings start at 750 for new players and are updated after each verified game using a pairwise comparison model. The Platform assigns rank tiers (including but not limited to Novice, Skilled, Expert, Master, and Grandmaster) based on Elo thresholds. Rankings are segmented by season, club, and geographic location, with both seasonal and all-time leaderboards. Elo ratings, rank tiers, and leaderboard positions are provided for entertainment and community engagement purposes. We reserve the right to modify the rating algorithm, adjust K-factor values, adjust individual or aggregate ratings, reset seasonal rankings, or restructure the ranking system at any time. Rankings and ratings do not confer any real-world standing, certification, or official recognition unless separately established through a partnership with a recognized governing body.</P>
      </Section>

      <Section number={7} title="Achievements and Badges">
        <P>The Platform awards badges and achievements to players based on their activity, performance, and milestones. Achievement categories may include wins, streaks, community participation, hand-specific accomplishments, and other criteria determined by us. Badges are displayed on player profiles and are visible to other Platform users. We reserve the right to modify, add, remove, or restructure the achievement system at any time, including changing the criteria for earning specific badges. Previously earned badges may be retained, reclassified, or retired at our discretion.</P>
      </Section>

      <Section number={8} title="Clubs and Organizations">
        <P>The Platform provides tools for Mah Jongg clubs and organizations to manage rosters, track results, run club-level leaderboards, and engage members. Club organizers who register clubs on the Platform are responsible for ensuring they have authorization to represent the club, the accuracy of club information and member rosters, compliance with these Terms by their club members, managing club-level disputes among members, and the appropriate use of any club management tools including reporting, analytics, and communication features. We are not responsible for the actions or conduct of any club, its organizers, or its members.</P>
      </Section>

      <Section number={9} title="Tournaments">
        <P>The Platform may offer tournament management features including bracket generation, Elo-seeded pairings, automated scoring, and public results pages. Tournament organizers are responsible for establishing and communicating tournament rules to participants, ensuring fair play and compliance with these Terms, resolving disputes that arise during tournament play, and any fees, prizes, or other obligations associated with their tournaments. We provide the tools for tournament administration but are not the organizer of any tournament hosted on the Platform unless explicitly stated otherwise. We are not responsible for the conduct of tournament organizers or participants.</P>
      </Section>

      <Section number={10} title="Notifications and Communications">
        <SubSection number="10.1" title="Push Notifications">
          <P>The Platform may send push notifications to your device to alert you about pending game confirmations and verification requests, new achievements and badges earned, leaderboard and ranking changes, community board activity and direct messages, club announcements and updates, and tournament-related updates. You can manage or disable push notifications at any time through your device settings or the Platform's notification preferences. Disabling push notifications may affect your ability to receive time-sensitive information such as game verification requests.</P>
        </SubSection>
        <SubSection number="10.2" title="Email Communications">
          <P>By creating an account, you consent to receive transactional emails related to your account and Platform activity, including account verification, password resets, game confirmations, and important Platform updates. We may also send promotional or informational emails about new features, Platform news, and community updates. You may opt out of promotional emails at any time by using the unsubscribe link included in each email or by updating your communication preferences in your account settings. You may not opt out of transactional emails that are necessary for the operation of your account.</P>
        </SubSection>
      </Section>

      <Section number={11} title="Intellectual Property">
        <SubSection number="11.1" title="Our Intellectual Property">
          <P>The Platform and its original content, features, functionality, design, and branding (including the Monmouth Made Mah Jongg™ name, logos, tile designs, badge artwork, rank tier names, and the proprietary Elo algorithm implementation) are owned by us and are protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of the Platform or its content without our prior written permission.</P>
        </SubSection>
        <SubSection number="11.2" title="Your Content">
          <P>By submitting content to the Platform (including game data, profile information, community board posts, and any other user-generated content), you grant us a non-exclusive, worldwide, royalty-free, perpetual license to use, display, reproduce, and distribute such content in connection with operating and promoting the Platform. You represent that you have the right to grant this license and that your content does not violate the rights of any third party.</P>
        </SubSection>
        <SubSection number="11.3" title="DMCA and Copyright Complaints">
          <P>If you believe that content posted on the community board or elsewhere on the Platform infringes your copyright, you may submit a notice to us at the email address listed below. Your notice should include identification of the copyrighted work you claim has been infringed, identification of the material on the Platform that you claim is infringing and its location, your contact information (name, address, email, phone number), a statement that you have a good faith belief that the use of the material is not authorized by the copyright owner, and a statement, under penalty of perjury, that the information in your notice is accurate and that you are the copyright owner or authorized to act on their behalf. We will respond to valid copyright complaints in accordance with applicable law and may remove or disable access to the allegedly infringing material.</P>
        </SubSection>
      </Section>

      <Section number={12} title="Disclaimer of Affiliation">
        <P>Monmouth Made Mah Jongg™ is an independent platform and is not affiliated with, endorsed by, or sponsored by the National Mah Jongg League (NMJL), the American Mah Jongg Association, or any other official Mah Jongg governing body. References to NMJL rules, card sections, hand categories, or scoring conventions are made for informational and gameplay tracking purposes only. The NMJL annual card and its contents are the property of the NMJL and are referenced on this Platform solely to facilitate accurate game logging.</P>
      </Section>

      <Section number={13} title="Fees and Premium Features">
        <P>The core features of the Platform are currently provided free of charge, including game logging, basic statistics, leaderboards, badges and achievements, community board access, direct messaging, club membership, and the activity feed. We reserve the right to introduce premium features, subscription tiers, or paid services in the future. Premium features may include advanced analytics, exportable reports, club administration tools, tournament management features, custom profile options, and other enhanced functionality. If we introduce paid services, we will clearly communicate pricing, features, and billing terms before you are charged. Any paid services will be subject to additional terms presented at the time of purchase. Fees, once paid, are non-refundable except as required by applicable law or as otherwise stated in the applicable purchase terms.</P>
      </Section>

      <Section number={14} title="Merchandise and E-Commerce">
        <P>The Platform may offer branded merchandise and Mah Jongg products for sale, including but not limited to tiles, racks, table mats, apparel, and accessories. Purchases of physical goods are subject to separate purchase terms, shipping policies, and return/refund policies that will be presented at the time of purchase. We are not responsible for delays, damage, or loss caused by shipping carriers. Product descriptions are provided in good faith, but we do not warrant that product descriptions, pricing, or other content are error-free.</P>
      </Section>

      <Section number={15} title="Termination">
        <P>We reserve the right to suspend or terminate your account and access to the Platform at our sole discretion, with or without notice, for any reason, including if we reasonably believe you have violated these Terms. Actions that may result in suspension or termination include submitting fraudulent game data, harassing other users on the community board or through direct messages, repeatedly violating content standards, attempting to manipulate rankings or ratings, or any other conduct we deem harmful to the Platform or its community. Upon termination, your right to use the Platform ceases immediately. Provisions of these Terms that by their nature should survive termination will survive, including intellectual property provisions, disclaimers, limitations of liability, and dispute resolution.</P>
        <P>You may delete your account at any time by contacting us or through your account settings. Upon account deletion, we will remove your personal information in accordance with our Privacy Policy, though anonymized game data may be retained to preserve the accuracy of other players' statistics and rankings. Community board posts made prior to account deletion may be retained in anonymized form to maintain the coherence of community discussions.</P>
      </Section>

      <Section number={16} title="Disclaimers">
        <P caps>THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE PLATFORM WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE, OR THAT ANY DEFECTS WILL BE CORRECTED. WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, OR RELIABILITY OF ANY CONTENT POSTED BY USERS ON THE COMMUNITY BOARD OR TRANSMITTED THROUGH DIRECT MESSAGES. YOUR USE OF THE PLATFORM IS AT YOUR SOLE RISK.</P>
      </Section>

      <Section number={17} title="Limitation of Liability">
        <P caps>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL MONMOUTH MADE MAH JONGG™, ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE PLATFORM; ANY CONDUCT, CONTENT, OR COMMUNICATIONS OF ANY THIRD PARTY ON THE PLATFORM, INCLUDING BUT NOT LIMITED TO ANY CONTENT POSTED ON THE COMMUNITY BOARD OR SENT THROUGH DIRECT MESSAGES; ANY INTERACTIONS BETWEEN USERS FACILITATED BY THE PLATFORM; OR UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR CONTENT OR INFORMATION. OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THE PLATFORM SHALL NOT EXCEED THE GREATER OF FIFTY DOLLARS ($50.00) OR THE AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.</P>
      </Section>

      <Section number={18} title="Indemnification">
        <P>You agree to indemnify, defend, and hold harmless Monmouth Made Mah Jongg™ and its owners, officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, or expenses (including reasonable attorneys' fees) arising out of or related to your use of the Platform; any content you post on the community board or send through direct messages; your violation of these Terms; your violation of any rights of another person or entity; or any dispute between you and another user of the Platform.</P>
      </Section>

      <Section number={19} title="Dispute Resolution">
        <P>These Terms and any disputes arising from your use of the Platform are governed by the laws of the State of New Jersey, without regard to its conflict-of-law provisions. Any legal action or proceeding arising under these Terms shall be brought exclusively in the state or federal courts located in Monmouth County, New Jersey, and you consent to the personal jurisdiction of such courts.</P>
        <P>Before filing any claim, you agree to attempt to resolve the dispute informally by contacting us. If the dispute is not resolved within 30 days, either party may proceed with formal dispute resolution.</P>
      </Section>

      <Section number={20} title="Changes to These Terms">
        <P>We may revise these Terms from time to time at our sole discretion. Material changes will be communicated through the Platform, via push notification, or via email. Your continued use of the Platform after the effective date of any changes constitutes your acceptance of the revised Terms. If you do not agree to the updated Terms, you must stop using the Platform.</P>
      </Section>

      <Section number={21} title="Miscellaneous">
        <P>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect. Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. These Terms constitute the entire agreement between you and Monmouth Made Mah Jongg™ regarding the Platform and supersede all prior agreements and understandings.</P>
      </Section>

      <Section number={22} title="Contact Us">
        <P>If you have questions about these Terms, wish to report a violation, or need to submit a copyright complaint, please contact us at:</P>
        <P><strong>Monmouth Made Mah Jongg™</strong><br />
        Email: support@monmouthmademahjongg.com<br />
        Website: monmouthmademahjongg.com</P>
      </Section>
    </LegalPage>
  )
}