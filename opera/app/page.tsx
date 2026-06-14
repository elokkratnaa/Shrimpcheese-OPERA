import React from 'react'
import Link from 'next/link'
import OperaNav from '@/app/components/shared/OperaNav'
import OperaFooter from '@/app/components/shared/OperaFooter'
import PersonaBubble from '@/app/components/shared/PersonaBubble'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const navVariant = session ? 'authed' : 'guest'

  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5]">
      <OperaNav variant={navVariant} />

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-start text-left max-w-xl">
          <h1 className="font-heading font-bold text-5xl md:text-6xl text-[#141413] tracking-tight leading-[1.05] mb-6">
            Stop circling. Start deciding.
          </h1>
          <p className="text-lg text-[#3d3d3a] leading-[1.55] mb-8 font-medium">
            Raw mental dumps transform into structured multi-perspective AI debates, resolving into a concrete action blueprint.
          </p>
          <Link href="/register">
            <Button className="bg-[#cc785c] hover:bg-[#a9583e] text-white text-base font-semibold px-8 py-4 h-auto rounded-md shadow-sm border-transparent cursor-pointer">
              Start your first session
            </Button>
          </Link>
        </div>

        <div className="w-full">
          <Card className="bg-[#f5f0e8] border border-[#e6dfd8] rounded-xl p-6 shadow-sm flex flex-col gap-6 ring-0">
            <span className="text-[12px] font-medium tracking-[1.5px] uppercase text-[#6c6a64]">
              Active Performers Debate
            </span>
            <div className="flex flex-col gap-4">
              <PersonaBubble
                persona_name="The Pragmatic Stoic"
                variant="a"
                message_content="Risk minimization is key. Let us secure the baseline before making aggressive jumps."
              />
              <PersonaBubble
                persona_name="The Venture Capitalist"
                variant="b"
                message_content="Calculated risks yield the highest leverage. Playing it too safe is the greatest hazard."
              />
              <PersonaBubble
                persona_name="The Creative Hedonist"
                variant="c"
                message_content="Prioritize the experience. If the choice drains your joy, no level of safety validates it."
              />
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-[#f5f0e8] py-16 px-6 md:px-8 border-y border-[#e6dfd8]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl font-semibold text-center text-[#141413] mb-12 tracking-tight">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-[#faf9f5] border border-[#e6dfd8] rounded-lg p-6 flex flex-col items-center text-center shadow-none ring-0">
              <CardContent className="pt-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#cc785c]/10 text-[#cc785c] text-xl font-bold mb-4">1</span>
                <h3 className="text-lg font-medium text-[#141413] mb-2 font-heading">Dump your thoughts</h3>
                <p className="text-sm text-[#3d3d3a] leading-[1.55]">Paste or stream unstructured stream-of-consciousness, doubts, and goals.</p>
              </CardContent>
            </Card>

            <Card className="bg-[#faf9f5] border border-[#e6dfd8] rounded-lg p-6 flex flex-col items-center text-center shadow-none ring-0">
              <CardContent className="pt-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5db8a6]/10 text-[#5db8a6] text-xl font-bold mb-4">2</span>
                <h3 className="text-lg font-medium text-[#141413] mb-2 font-heading">Watch them debate</h3>
                <p className="text-sm text-[#3d3d3a] leading-[1.55]">Archetypes dissect your options from stopper, growth, and joy lenses.</p>
              </CardContent>
            </Card>

            <Card className="bg-[#faf9f5] border border-[#e6dfd8] rounded-lg p-6 flex flex-col items-center text-center shadow-none ring-0">
              <CardContent className="pt-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5db872]/10 text-[#5db872] text-xl font-bold mb-4">3</span>
                <h3 className="text-lg font-medium text-[#141413] mb-2 font-heading">Commit to action</h3>
                <p className="text-sm text-[#3d3d3a] leading-[1.55]">Externalize conflicts, resolve paradoxes, and finalize your actionable verdict.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-[#efe9de] py-16 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-heading text-3xl font-semibold text-center text-[#141413] mb-12 tracking-tight">What it feels like</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-[#faf9f5] border border-[#e6dfd8] rounded-lg p-6 shadow-none ring-0">
              <CardContent className="pt-6 italic text-[#3d3d3a] text-base leading-[1.55]">
                &ldquo;I spent three weeks cycling on whether to sign the lease or keep hunting. Five minutes in OPERA laid bare my safety anxiety versus my growth goals. The stopper and optimizer archetypes debated it out, and the commit badge helped me make the move.&rdquo;
                <span className="block mt-4 not-italic text-sm font-semibold text-[#141413] font-heading">&mdash; Alex, Product Designer</span>
              </CardContent>
            </Card>

            <Card className="bg-[#faf9f5] border border-[#e6dfd8] rounded-lg p-6 shadow-none ring-0">
              <CardContent className="pt-6 italic text-[#3d3d3a] text-base leading-[1.55]">
                &ldquo;It is like having a stoic advisor, a venture capitalist, and a creative thinker fighting in your corner. Instead of asking friends and searching on forums, I externalize the noise and get an actionable blueprint.&rdquo;
                <span className="block mt-4 not-italic text-sm font-semibold text-[#141413] font-heading">&mdash; Maya, Tech Founder</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 w-full">
        <Card className="bg-[#cc785c] text-white rounded-xl p-8 md:p-12 shadow-sm border-transparent flex flex-col md:flex-row items-center justify-between gap-8 ring-0">
          <div className="flex flex-col items-start max-w-xl text-left">
            <h2 className="font-heading text-3xl md:text-4xl text-white font-bold tracking-tight leading-[1.1] mb-4">
              Your head is full. Let OPERA sort it.
            </h2>
            <p className="text-white/80 text-sm md:text-base leading-[1.55]">
              Offload mental weight and transform raw thoughts into a committing blueprint today.
            </p>
          </div>
          <Link href="/register" className="shrink-0 w-full md:w-auto">
            <Button className="bg-[#faf9f5] hover:bg-[#f5f0e8] text-[#141413] text-base font-semibold px-8 py-4 h-auto rounded-md shadow-sm border-transparent w-full cursor-pointer font-heading">
              Start for free
            </Button>
          </Link>
        </Card>
      </section>

      <OperaFooter />
    </div>
  )
}
