import { describe, expect, it } from 'vitest';

import { renderCustomerMail } from './customer';

const base = {
  locale: 'en' as const,
  customerName: 'Anna Berg',
  tourTitle: 'Barolo & Barbaresco Harvest',
  people: 2,
  departureLabel: '21 September 2027',
  from: 'Titan Tours'
};

describe('renderCustomerMail', () => {
  it('confirms a booked place', () => {
    const mail = renderCustomerMail({ ...base, kind: 'booked' });

    expect(mail.subject).toBe(
      'Your place on Barolo & Barbaresco Harvest is confirmed'
    );
    expect(mail.text).toContain('Hi Anna Berg,');
    expect(mail.text).toContain('Status: Confirmed');
  });

  it('says plainly that a queued signup is not a booking', () => {
    const mail = renderCustomerMail({ ...base, kind: 'waiting' });

    expect(mail.subject).toContain('waiting list');
    expect(mail.text).toContain('Status: Waiting list');
    // The reassurance is the point of the mail, not decoration
    expect(mail.text).toContain('nothing is charged');
  });

  it('tells a promoted customer the place is theirs', () => {
    const mail = renderCustomerMail({ ...base, kind: 'promoted' });

    expect(mail.subject).toContain('A place has opened up');
    expect(mail.text).toContain('Status: Confirmed');
  });

  it('escapes customer supplied text in the html part', () => {
    // The name comes from a public form; it must arrive as text, not markup
    const mail = renderCustomerMail({
      ...base,
      kind: 'booked',
      customerName: '<script>alert(1)</script>'
    });

    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;');
  });

  it('leaves out a departure that is not confirmed yet', () => {
    const mail = renderCustomerMail({
      ...base,
      kind: 'booked',
      departureLabel: null
    });

    expect(mail.text).not.toContain('Departure');
  });

  it('translates the whole mail', () => {
    const mail = renderCustomerMail({ ...base, kind: 'booked', locale: 'sv' });

    expect(mail.subject).toContain('är bekräftad');
    expect(mail.text).toContain('Hej Anna Berg,');
  });
});
