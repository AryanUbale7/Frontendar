"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { DEVELOPER_FAQS } from "@/constants/landing-data";

export function FAQSection() {
  return (
    <section id="faq" className="py-16 md:py-24 bg-white border-t border-[#E2E8F0]">
      <div className="mx-auto max-w-4xl px-4 md:px-6 space-y-10">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <Badge variant="accent" size="sm">
            Got Questions?
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#0F172A]">
            Frequently Asked Questions
          </h2>
          <p className="text-base text-[#475569]">
            Everything you need to know about participating in Frontend Arena hackathons.
          </p>
        </div>

        {/* Accordion Component */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {DEVELOPER_FAQS.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
