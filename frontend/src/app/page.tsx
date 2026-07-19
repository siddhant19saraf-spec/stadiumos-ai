"use client";

import Link from "next/link";
import {
  ArrowRight,
  Gauge,
  Users,
  Shield,
  Siren,
  Car,
  Clock,
  Globe,
  Bot,
  Wrench,
  LayoutDashboard,
  Zap,
  Leaf,
  Sparkles,
  Calendar,
  Droplets,
  Recycle,
  TreePine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LandingHeader } from "@/components/layout/landing-header";
import { Footer } from "@/components/layout/footer";
import { APP_NAME } from "@/constants";

const features = [
  {
    title: "Command Center",
    description: "Real-time operations dashboard with AI-powered KPIs and system health monitoring.",
    icon: Gauge,
    href: "/command-center",
  },
  {
    title: "Crowd Intelligence",
    description: "Real-time density mapping, flow prediction, and pinch-point detection across the venue.",
    icon: Users,
    href: "/crowd-intelligence",
  },
  {
    title: "AI Copilot",
    description: "Conversational AI assistant for instant operational insights and recommendations.",
    icon: Sparkles,
    href: "#",
  },
  {
    title: "Emergency Response",
    description: "Automated incident detection, evacuation routing, and first-responder dispatch coordination.",
    icon: Siren,
    href: "/emergency-response",
  },
  {
    title: "Smart Parking",
    description: "Occupancy prediction, dynamic pricing, and valet routing optimization.",
    icon: Car,
    href: "/parking",
  },
  {
    title: "Queue Analytics",
    description: "Wait-time forecasting with automated staff trigger alerts for optimal service levels.",
    icon: Clock,
    href: "/queue-prediction",
  },
  {
    title: "Digital Twin",
    description: "3D/2D stadium model with live IoT sensor overlay and simulation capabilities.",
    icon: Globe,
    href: "/digital-twin",
  },
  {
    title: "Fan Experience",
    description: "Multilingual AI chatbot with personalized itineraries and real-time assistance.",
    icon: Bot,
    href: "/fan-assistant",
  },
  {
    title: "Predictive Maintenance",
    description: "IoT anomaly detection and remaining-useful-life forecasting for critical infrastructure.",
    icon: Wrench,
    href: "/maintenance",
  },
  {
    title: "Executive Analytics",
    description: "KPI dashboards, AI-generated board reports, and strategic decision intelligence.",
    icon: LayoutDashboard,
    href: "/executive-analytics",
  },
  {
    title: "Energy & Sustainability",
    description: "Consumption monitoring, carbon tracking, and AI-driven optimization.",
    icon: Zap,
    href: "/energy",
  },
  {
    title: "Security Center",
    description: "Enterprise RBAC, audit logging, compliance monitoring, and threat detection.",
    icon: Shield,
    href: "/enterprise-security",
  },
  {
    title: "Tournament Operations",
    description: "Multi-venue scheduling, conflict detection, and resource optimization.",
    icon: Calendar,
    href: "/scheduling",
  },
  {
    title: "Sustainability",
    description: "AI-powered water, waste, energy, and carbon intelligence platform.",
    icon: Leaf,
    href: "/sustainability",
  },
];

const stats = [
  { value: "14+", label: "AI-Powered Modules" },
  { value: "Real-time", label: "Live Data Processing" },
  { value: "99.9%", label: "System Uptime" },
  { value: "Multi-venue", label: "Scalable Architecture" },
];

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <section className="relative overflow-hidden border-b">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          <div className="mx-auto max-w-7xl px-6 pt-32 pb-24 md:pt-40 md:pb-32 relative">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium mb-6">
                <div className="size-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Hack2Sustain 2026 — AI for Sustainable Stadium Operations
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Autonomous Stadium{" "}
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Operations Platform
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Enterprise-grade AI platform that monitors, predicts, and optimizes every aspect of
                stadium and tournament operations — from crowd flow and parking to energy consumption
                and emergency response.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/command-center">
                  <Button size="lg" className="w-full sm:w-auto text-base">
                    Launch Dashboard
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                    Explore Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything You Need to Run a Stadium
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                {features.length} integrated modules covering operations, intelligence, safety, fan
                experience, and analytics — all working together in real time.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Link key={feature.title} href={feature.href}>
                    <Card className="group h-full transition-colors hover:border-primary/50 cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="font-semibold mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b py-20 md:py-28 bg-gradient-to-b from-emerald-50/50 via-background to-background dark:from-emerald-950/20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-14">
              <div className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-1.5 text-xs font-medium mb-6 text-emerald-700 dark:text-emerald-300">
                <Leaf className="size-3.5 mr-1.5" />
                Powered by AI for Sustainable Operations
              </div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sustainability at the Core
              </h2>
              <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
                Every module is engineered to reduce resource consumption, minimize waste, and lower the carbon
                footprint of large-scale venue operations. Aligned with UN Sustainable Development Goals.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-12">
              {[
                { icon: Zap, label: "Energy Reduction", value: "10–20%", description: "AI-driven load optimization across HVAC, lighting, and power systems" },
                { icon: Recycle, label: "Waste Reduction", value: "20–30%", description: "AI demand prediction for concessions and smart recycling zone management" },
                { icon: TreePine, label: "Carbon Tracking", value: "15–25%", description: "Real-time CO₂ monitoring with AI-recommended operational changes" },
                { icon: Droplets, label: "Water Conservation", value: "10–15%", description: "Consumption monitoring, leak detection, and irrigation optimization" },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <Card key={metric.label} className="border-emerald-200 dark:border-emerald-800/50">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                          <Icon className="size-4.5" />
                        </div>
                        <div>
                          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{metric.value}</div>
                          <div className="text-xs font-medium">{metric.label}</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-semibold mb-4">Aligned with UN Sustainable Development Goals</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { number: "7", name: "Affordable & Clean Energy" },
                  { number: "11", name: "Sustainable Cities" },
                  { number: "12", name: "Responsible Consumption" },
                  { number: "13", name: "Climate Action" },
                  { number: "6", name: "Clean Water" },
                ].map((sdg) => (
                  <div
                    key={sdg.number}
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm"
                  >
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {sdg.number}
                    </span>
                    <span className="text-muted-foreground">{sdg.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Transform Your Stadium Operations?
            </h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
              Explore the live dashboard and see how AI can optimize every aspect of your venue.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/command-center">
                <Button size="lg" className="w-full sm:w-auto text-base">
                  Launch Dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
