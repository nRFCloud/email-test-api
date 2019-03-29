import { S3 } from 'aws-sdk';
import { parse } from 'url';
import fetch from 'node-fetch';

const s3 = new S3();

const Bucket = process.env.S3_BUCKET!;
const graphQLEndpoint = parse(process.env.GRAPHQL_API_ENDPOINT!);
const apiKey = process.env.GRAPHQL_API_KEY!;

const publishEmailMutation = `mutation publishEmail($from: String, $subject: String!, $to: [String!]!, $body: String!, $timestamp: String!) {
        publishTenantAggregateEvent(from: $from, subject: $subject, to: $to, body: $body, timestamp: $timestamp) {
            from
            subject
            to
            body
            timestamp
        }
    }`;

type SESEvent = {
    Records: {
        eventSource: 'aws:ses';
        eventVersion: '1.0';
        ses: {
            mail: {
                timestamp: string;
                source: string;
                messageId: string;
                destination: string[];
                headersTruncated: boolean;
                headers: { name: string; value: string }[];
                commonHeaders: {
                    returnPath: string;
                    from: string[];
                    date: string;
                    to: string[];
                    messageId: string;
                    subject: string;
                };
            };
            receipt: {
                timestamp: string;
                processingTimeMillis: number;
                recipients: string[];
                spamVerdict: { status: 'DISABLED' };
                virusVerdict: { status: 'DISABLED' };
                spfVerdict: { status: 'PASS' };
                dkimVerdict: { status: 'GRAY' };
                dmarcVerdict: { status: 'PASS' };
                action: {
                    type: 'Lambda';
                    functionArn: string;
                    invocationType: 'Event';
                };
            };
        };
    }[];
};

type GQLMail = {
    from: string;
    subject: string;
    to: string[];
    body: string;
    timestamp: string;
};

export const handler = async (event: SESEvent) => {
    await Promise.all(
        event.Records.map(async r => {
            const { Body } = await s3
                .getObject({
                    Bucket,
                    Key: r.ses.mail.messageId,
                })
                .promise();

            const mail: GQLMail = {
                from: r.ses.mail.commonHeaders.from[0],
                to: r.ses.mail.commonHeaders.to,
                subject: r.ses.mail.commonHeaders.subject,
                timestamp: r.ses.receipt.timestamp,
                body: (Body && Body.toString()) || '',
            };
            console.log(JSON.stringify(mail));

            await publishEmail({
                query: publishEmailMutation,
                operationName: 'publishEmail',
                variables: mail,
            });
        }),
    );
};

const publishEmail = async (mutation: object) => {
    const options = {
        method: 'POST',
        body: JSON.stringify(mutation),
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
        },
    };

    try {
        const res = await fetch(graphQLEndpoint.href!, options);
        console.log(
            JSON.stringify({
                res,
                headers: res.headers.raw(),
            }),
        );
        console.log(
            JSON.stringify({
                json: await res.json(),
            }),
        );
    } catch (err) {
        console.error(JSON.stringify({ err, options }));
        throw err;
    }
};
