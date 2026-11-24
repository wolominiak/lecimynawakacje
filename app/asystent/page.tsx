import type { Metadata } from 'next';
import AssistantChat from '@/components/AssistantChat';

export const metadata: Metadata = {
  title: 'Asystent podróży AI - zaplanuj wakacje dzień po dniu | Lecimy na wakacje',
  description: 'Asystent AI ułoży plan wyjazdu dzień po dniu, znajdzie oferty biur podróży z cenami i terminami, poleci wycieczki i internet eSIM.',
  alternates: { canonical: '/asystent/' },
};

export default function Page() {
  return (
    <section className="as-page">
      <div className="wrap">
        <div className="as-intro">
          <span className="eyebrow">Nowość</span>
          <h1>Asystent podróży AI</h1>
          <p className="lead">Opisz wymarzony wyjazd. Asystent ułoży plan dzień po dniu, pokaże prawdziwe oferty biur podróży z cenami, poleci wycieczki i podpowie, jak mieć internet na miejscu.</p>
        </div>
        <AssistantChat full />
      </div>
    </section>
  );
}
