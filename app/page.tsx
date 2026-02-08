"use client"

import { useState } from "react"
import { Header } from "@/components/landing/header"
import { Hero } from "@/components/landing/hero"
import { TrustBar } from "@/components/landing/trust-bar"
import { ProductSection } from "@/components/landing/product-section"
import { WhyAdapt } from "@/components/landing/why-adapt"
import { Testimonials } from "@/components/landing/testimonials"
import { CtaSection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { BookCallModal } from "@/components/landing/book-call-modal"

export default function HomePage() {
  const [bookCallOpen, setBookCallOpen] = useState(false)
  const openModal = () => setBookCallOpen(true)

  return (
    <div className="min-h-screen dark">
      <Header onBookCall={openModal} />
      <main>
        <Hero onBookCall={openModal} />
        <TrustBar />
        <ProductSection />
        <WhyAdapt onBookCall={openModal} />
        <Testimonials />
        <CtaSection onBookCall={openModal} />
      </main>
      <Footer />
      <BookCallModal open={bookCallOpen} onOpenChange={setBookCallOpen} />
    </div>
  )
}
