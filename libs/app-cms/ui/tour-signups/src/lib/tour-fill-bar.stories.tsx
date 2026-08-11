import type { Meta, StoryObj } from '@storybook/react-vite';

import { TourFillBar } from './tour-fill-bar';

const meta = {
  title: 'App CMS/Tour signups/TourFillBar'
} satisfies Meta;

export default meta;

const labels = {
  full: 'Full',
  overbooked: 'Overbooked',
  waiting: (count: number) => `+${count} waiting`,
  summary: 'places taken'
};

const Row = ({
  note,
  children
}: {
  note: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-center gap-6">
    <span className="text-muted-foreground w-40 shrink-0 text-xs">{note}</span>
    {children}
  </div>
);

export const States: StoryObj = {
  render: () => (
    <div className="flex w-[40rem] flex-col gap-4">
      <Row note="empty">
        <TourFillBar booked={0} maxCustomers={20} labels={labels} />
      </Row>
      <Row note="filling up">
        <TourFillBar booked={12} maxCustomers={20} labels={labels} />
      </Row>
      <Row note="full">
        <TourFillBar booked={20} maxCustomers={20} labels={labels} />
      </Row>
      <Row note="full, queue behind it">
        <TourFillBar
          booked={20}
          maxCustomers={20}
          waiting={5}
          labels={labels}
        />
      </Row>
      <Row note="overbooked by the guide">
        <TourFillBar booked={22} maxCustomers={20} labels={labels} />
      </Row>
      <Row note="no maximum set">
        <TourFillBar booked={12} maxCustomers={null} labels={labels} />
      </Row>
    </div>
  )
};

export const ListCell: StoryObj = {
  render: () => (
    <div className="border-border divide-border w-[26rem] divide-y rounded-lg border">
      {[
        { title: 'Tuscany in autumn', booked: 12, max: 20, waiting: 0 },
        { title: 'Douro river cruise', booked: 20, max: 20, waiting: 3 },
        { title: 'Alsace harvest', booked: 22, max: 20, waiting: 0 },
        { title: 'Champagne weekend', booked: 6, max: null, waiting: 0 }
      ].map((tour) => (
        <div
          key={tour.title}
          className="flex items-center justify-between gap-4 px-4 py-3"
        >
          <span className="truncate text-sm">{tour.title}</span>
          <TourFillBar
            booked={tour.booked}
            maxCustomers={tour.max}
            waiting={tour.waiting}
            labels={labels}
            size="sm"
          />
        </div>
      ))}
    </div>
  )
};
