'use client';

import { Container, Title, Text, Stack, Divider, List, Anchor } from '@mantine/core';

export default function TermsOfServicePage() {
    const lastUpdated = 'January 31, 2026';
    const version = '1.1';
    const contactEmail = 'feldenserra@proton.me';

    return (
        <Container size="md" py="xl">
            <Stack gap="lg">
                <div>
                    <Title order={1}>Terms of Service</Title>
                    <Text c="dimmed" size="sm" mt="xs">Last Updated: {lastUpdated} | Version: {version}</Text>
                </div>

                <Text>
                    Welcome to HomeCoreOS. By accessing or using our service, you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them carefully.
                </Text>

                <Divider />

                <section>
                    <Title order={2} size="h3" mb="sm">1. Acceptance of Terms</Title>
                    <Text>
                        By creating an account or using HomeCoreOS, you agree to these Terms, our <Anchor href="/legal/privacy">Privacy Policy</Anchor>, and our <Anchor href="/legal/refund">Refund Policy</Anchor>. If you do not agree to these Terms, you may not use our service.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">2. Eligibility</Title>
                    <Text>
                        You must be at least 18 years old (or the age of majority in your jurisdiction, whichever is greater) to use HomeCoreOS. By using the service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">3. Description of Service</Title>
                    <Text>
                        HomeCoreOS is a home management application that helps users organize tasks, recipes, and other household activities. We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the service.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">4. Account Registration</Title>
                    <Text mb="sm">
                        To use HomeCoreOS, you must create an account. You agree to:
                    </Text>
                    <List>
                        <List.Item>Provide accurate and complete information during registration</List.Item>
                        <List.Item>Maintain the security of your account credentials and not share them with others</List.Item>
                        <List.Item>Promptly notify us of any unauthorized use of your account</List.Item>
                        <List.Item>Be solely responsible for all activities that occur under your account</List.Item>
                        <List.Item>Not create multiple accounts or accounts on behalf of others without authorization</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">5. Subscription and Payment</Title>
                    <Text mb="sm">
                        HomeCoreOS is offered as a subscription service:
                    </Text>
                    <List>
                        <List.Item>The subscription fee is $6.99 per month (plus applicable taxes)</List.Item>
                        <List.Item>New users receive a 7-day free trial; your payment method will be charged at the end of the trial unless you cancel</List.Item>
                        <List.Item>Subscriptions automatically renew each month unless cancelled</List.Item>
                        <List.Item>You may cancel your subscription at any time through your account settings</List.Item>
                        <List.Item>Upon cancellation, you retain access until the end of your current billing period</List.Item>
                        <List.Item>Payments are processed through Paddle, our Merchant of Record</List.Item>
                    </List>
                    <Text mt="sm">
                        Please refer to our <Anchor href="/legal/refund">Refund Policy</Anchor> for information about refunds.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">6. Acceptable Use</Title>
                    <Text mb="sm">
                        You agree not to:
                    </Text>
                    <List>
                        <List.Item>Use the service for any unlawful purpose or in violation of any applicable laws</List.Item>
                        <List.Item>Attempt to gain unauthorized access to our systems, servers, or networks</List.Item>
                        <List.Item>Interfere with or disrupt the service or servers connected to the service</List.Item>
                        <List.Item>Upload malicious code, viruses, or any harmful content</List.Item>
                        <List.Item>Resell, redistribute, or commercially exploit the service without authorization</List.Item>
                        <List.Item>Use the service to harass, abuse, defame, or harm others</List.Item>
                        <List.Item>Reverse engineer, decompile, or disassemble any part of the service</List.Item>
                        <List.Item>Use automated systems (bots, scrapers) to access the service without permission</List.Item>
                    </List>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">7. Intellectual Property</Title>
                    <Text>
                        HomeCoreOS and its original content, features, functionality, design, logos, and trademarks are owned by HomeCoreOS and are protected by copyright, trademark, patent, trade secret, and other intellectual property laws. You may not copy, modify, distribute, sell, or lease any part of our service or software without our express written permission. You retain ownership of any content you create within the service.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">8. User Content</Title>
                    <Text>
                        You retain all rights to the content you create, upload, or store through HomeCoreOS (such as recipes, tasks, and notes). By using the service, you grant us a limited, non-exclusive, royalty-free license to store, process, display, and transmit your content solely to provide and improve the service to you. We will not use your content for advertising or share it publicly without your consent.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">9. Disclaimer of Warranties</Title>
                    <Text>
                        THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS. YOUR USE OF THE SERVICE IS AT YOUR OWN RISK. NO ADVICE OR INFORMATION OBTAINED FROM US SHALL CREATE ANY WARRANTY NOT EXPRESSLY STATED HEREIN.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">10. Limitation of Liability</Title>
                    <Text mb="sm">
                        TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, HOMECOREOS AND ITS OWNERS, OPERATORS, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, REVENUES, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:
                    </Text>
                    <List>
                        <List.Item>Your use or inability to use the service</List.Item>
                        <List.Item>Any unauthorized access to or alteration of your data</List.Item>
                        <List.Item>Any third-party conduct or content on the service</List.Item>
                        <List.Item>Any interruption or cessation of the service</List.Item>
                    </List>
                    <Text mt="sm" fw={600}>
                        IN NO EVENT SHALL OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED DOLLARS ($100 USD).
                    </Text>
                    <Text mt="sm" size="sm">
                        Some jurisdictions do not allow the exclusion or limitation of certain damages, so some of the above limitations may not apply to you.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">11. Indemnification</Title>
                    <Text>
                        You agree to defend, indemnify, and hold harmless HomeCoreOS and its owners, operators, officers, directors, employees, contractors, and agents from and against any and all claims, damages, obligations, losses, liabilities, costs, and expenses (including reasonable attorney&apos;s fees) arising from: (a) your use of the service; (b) your violation of these Terms; (c) your violation of any third-party rights, including intellectual property rights; or (d) any content you submit through the service.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">12. Dispute Resolution & Arbitration</Title>
                    <Title order={3} size="h4" mb="xs" mt="md">Informal Resolution</Title>
                    <Text>
                        Before initiating any formal dispute resolution, you agree to first contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor> to attempt to resolve any dispute informally. We will attempt to resolve the dispute within 60 days.
                    </Text>
                    <Title order={3} size="h4" mb="xs" mt="md">Binding Arbitration</Title>
                    <Text>
                        If we cannot resolve a dispute informally, any dispute, claim, or controversy arising out of or relating to these Terms or the service (except for claims that may be brought in small claims court) shall be resolved by binding arbitration administered by the American Arbitration Association (&quot;AAA&quot;) under its Consumer Arbitration Rules. The arbitration shall be conducted in English, and the seat of arbitration shall be Clark County, Nevada. The arbitration may be conducted by telephone, video conference, or written submissions, at the arbitrator&apos;s discretion.
                    </Text>
                    <Title order={3} size="h4" mb="xs" mt="md">Class Action Waiver</Title>
                    <Text fw={600}>
                        YOU AND HOMECOREOS AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. YOU EXPRESSLY WAIVE ANY RIGHT TO PARTICIPATE IN A CLASS ACTION LAWSUIT OR CLASS-WIDE ARBITRATION AGAINST HOMECOREOS.
                    </Text>
                    <Title order={3} size="h4" mb="xs" mt="md">Small Claims Exception</Title>
                    <Text>
                        Either party may bring a qualifying claim in small claims court in Clark County, Nevada (or your county of residence if you qualify under local rules), rather than through arbitration.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">13. Termination</Title>
                    <Text>
                        We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including but not limited to violations of these Terms, suspected fraudulent activity, or any other reason at our sole discretion. Upon termination, your right to use the service will immediately cease. You may terminate your account at any time by cancelling your subscription and ceasing use of the service. Upon termination, certain provisions of these Terms shall survive, including but not limited to Sections 9-12, 14, and 16-19.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">14. Force Majeure</Title>
                    <Text>
                        We shall not be liable for any failure or delay in performance resulting from causes beyond our reasonable control, including but not limited to: acts of God, natural disasters, war, terrorism, civil unrest, labor disputes, government actions, pandemic or epidemic, internet service provider failures, third-party service outages, power outages, or cyberattacks. During such events, our obligations shall be suspended for the duration of the event.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">15. Governing Law</Title>
                    <Text>
                        These Terms shall be governed by and construed in accordance with the laws of the State of Nevada, United States, without regard to its conflict of law provisions. You agree to submit to the exclusive jurisdiction of the courts located in Clark County, Nevada for any disputes not subject to arbitration.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">16. Changes to Terms</Title>
                    <Text>
                        We reserve the right to modify these Terms at any time. We will provide notice of material changes via email or through a prominent notice on the service at least 30 days before the changes take effect. Your continued use of the service after changes take effect constitutes acceptance of the new Terms. If you do not agree to the modified Terms, you must stop using the service and cancel your subscription.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">17. Severability</Title>
                    <Text>
                        If any provision of these Terms is found to be unenforceable or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect and enforceable. The invalidity of any provision shall not affect the validity of the remaining provisions.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">18. Entire Agreement</Title>
                    <Text>
                        These Terms, together with our <Anchor href="/legal/privacy">Privacy Policy</Anchor> and <Anchor href="/legal/refund">Refund Policy</Anchor>, constitute the entire agreement between you and HomeCoreOS regarding your use of the service. These Terms supersede all prior agreements, understandings, negotiations, and communications, whether written or oral, between you and HomeCoreOS regarding the subject matter hereof.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">19. Waiver</Title>
                    <Text>
                        No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term. Our failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.
                    </Text>
                </section>

                <section>
                    <Title order={2} size="h3" mb="sm">20. Contact Us</Title>
                    <Text>
                        If you have any questions about these Terms, please contact us at{' '}
                        <Anchor href={`mailto:${contactEmail}`}>{contactEmail}</Anchor>.
                    </Text>
                </section>
            </Stack>
        </Container>
    );
}
