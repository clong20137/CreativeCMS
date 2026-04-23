export const demoStarterSections: Record<string, any[]> = {
  restaurant: [
    {
      id: 'restaurant-hero',
      type: 'hero',
      title: 'Modern Grill Energy, Neighborhood Table Soul',
      body: 'A polished restaurant homepage with strong food photography, reservations, menu highlights, private dining, and catering.',
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1800&q=80',
      buttonLabel: 'View Menu',
      buttonUrl: '#menu',
      secondaryButtonLabel: 'Book a Table',
      secondaryButtonUrl: '/contact'
    },
    {
      id: 'restaurant-cards',
      type: 'imageCards',
      title: 'Featured Experiences',
      columns: 3,
      items: [
        { id: 'card-1', title: 'Steakhouse Favorites', description: 'Seared cuts, bright sides, and polished dinner service.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Reserve', buttonUrl: '/contact' },
        { id: 'card-2', title: 'Sushi & Seafood', description: 'Fresh rolls, crisp starters, and shareable plates.', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'View Menu', buttonUrl: '#menu' },
        { id: 'card-3', title: 'Private Events', description: 'Chef-led dinners, celebrations, and intimate gatherings.', image: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Plan Event', buttonUrl: '/contact' }
      ]
    },
    { id: 'restaurant-menu-plugin', type: 'plugin', pluginSlug: 'restaurant', title: 'Featured Menu' },
    { id: 'restaurant-cta', type: 'cta', title: 'Ready to Fill More Tables?', body: 'Turn this demo into a restaurant site your client can edit and launch.', buttonLabel: 'Start a Project', buttonUrl: '/contact' }
  ],
  'towing-transport': [
    {
      id: 'towing-hero',
      type: 'hero',
      title: 'Heavy Recovery, Towing, and Transport Without the Guesswork',
      body: 'A demo site for operators who move trucks, machines, job-site equipment, and urgent recovery calls.',
      imageUrl: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true',
      buttonLabel: 'Request a Quote',
      buttonUrl: '/contact',
      secondaryButtonLabel: 'Call Dispatch',
      secondaryButtonUrl: 'tel:+15550199411'
    },
    {
      id: 'towing-services',
      type: 'imageCards',
      title: 'Built for Heavy Loads and Hard Calls',
      columns: 4,
      items: [
        { id: 'tow-1', title: 'Heavy-Duty Towing', description: 'Tractors, buses, RVs, and commercial fleets.', image: 'https://unsplash.com/photos/qlx6GLKvgHw/download?force=true', buttonLabel: 'Get Help', buttonUrl: '/contact' },
        { id: 'tow-2', title: 'Flatbed Towing', description: 'Secure roadside pickup and damage-aware delivery.', image: 'https://unsplash.com/photos/dF6Sh8krxd4/download?force=true', buttonLabel: 'Schedule', buttonUrl: '/contact' },
        { id: 'tow-3', title: 'Recovery Dispatch', description: 'Winching, disabled vehicles, and accident scenes.', image: 'https://unsplash.com/photos/IW9QDmpmZUY/download?force=true', buttonLabel: 'Dispatch', buttonUrl: '/contact' },
        { id: 'tow-4', title: 'Equipment Moves', description: 'Construction, industrial, farm, and specialty relocation.', image: 'https://unsplash.com/photos/Q7shv9IN7cc/download?force=true', buttonLabel: 'Quote', buttonUrl: '/contact' }
      ]
    },
    { id: 'towing-process', type: 'columns', title: 'Simple Steps for Complicated Moves', columns: 3, items: [{ id: 'col-1', sections: [{ id: 'h1', type: 'header', title: 'Request Dispatch' }, { id: 'p1', type: 'paragraph', body: 'Send pickup, dropoff, weight, and urgency.' }] }, { id: 'col-2', sections: [{ id: 'h2', type: 'header', title: 'We Bring the Gear' }, { id: 'p2', type: 'paragraph', body: 'Operators arrive with the right truck, trailer, and plan.' }] }, { id: 'col-3', sections: [{ id: 'h3', type: 'header', title: 'Secure Delivery' }, { id: 'p3', type: 'paragraph', body: 'Clear communication from pickup to dropoff.' }] }] },
    { id: 'towing-contact', type: 'contactForm', title: 'Request a Quote' }
  ],
  barbershop: [
    { id: 'barber-hero', type: 'hero', title: 'Let Clients Choose Their Chair', body: 'A sharp barbershop starter page for services, memberships, booking, and team highlights.', imageUrl: 'https://unsplash.com/photos/k6RsU8om2UE/download?force=true', buttonLabel: 'Book a Cut', buttonUrl: '/contact' },
    { id: 'barber-services', type: 'imageCards', title: 'Cuts, Trims, and Memberships', columns: 3, items: [{ id: 'b1', title: 'Signature Cuts', description: 'Clean fades, scissor cuts, and style refreshes.', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book', buttonUrl: '/contact' }, { id: 'b2', title: 'Beard Work', description: 'Lineups, trims, hot towel finishes, and detail work.', image: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book', buttonUrl: '/contact' }, { id: 'b3', title: 'Monthly Plans', description: 'Recurring grooming plans for clients who stay sharp.', image: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Join', buttonUrl: '/contact' }] },
    { id: 'barber-cta', type: 'cta', title: 'Keep the Chairs Full', body: 'Use this demo starter for a local grooming brand.', buttonLabel: 'Start Project', buttonUrl: '/contact' }
  ],
  'real-estate': [
    { id: 'real-estate-hero', type: 'hero', title: 'Homes, Neighborhoods, and Leads in One Place', body: 'A polished real estate starter for featured listings, neighborhoods, agents, and lead capture.', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=80', buttonLabel: 'View Listings', buttonUrl: '/plugins/real-estate' },
    { id: 'real-estate-plugin', type: 'plugin', pluginSlug: 'real-estate', title: 'Featured Listings' },
    { id: 'real-estate-cards', type: 'imageCards', title: 'Neighborhood Focus', columns: 3, items: [{ id: 'r1', title: 'Downtown Living', description: 'Condos, walkability, and city amenities.', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Explore', buttonUrl: '/contact' }, { id: 'r2', title: 'Suburban Homes', description: 'Space, schools, and quiet streets.', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Explore', buttonUrl: '/contact' }, { id: 'r3', title: 'Investment Properties', description: 'Income-ready options and market guidance.', image: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Invest', buttonUrl: '/contact' }] },
    { id: 'real-estate-contact', type: 'contactForm', title: 'Start Your Search' }
  ],
  electrician: [
    { id: 'electrician-hero', type: 'hero', title: 'Fast, Licensed Electrical Help When the Lights Cannot Wait', body: 'A high-conversion electrician starter for emergency calls, repairs, upgrades, inspections, and service estimates.', imageUrl: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1800&q=80', buttonLabel: 'Request Service', buttonUrl: '/contact', secondaryButtonLabel: 'Call Now', secondaryButtonUrl: 'tel:+15550190210' },
    { id: 'electrician-services', type: 'imageCards', title: 'Residential and Commercial Electrical Services', columns: 3, items: [{ id: 'e1', title: 'Emergency Repair', description: 'Outages, breakers, unsafe wiring, and urgent troubleshooting.', image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Get Help', buttonUrl: '/contact' }, { id: 'e2', title: 'Panel Upgrades', description: 'Modern panels, service capacity, surge protection, and code-aware installs.', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Plan Upgrade', buttonUrl: '/contact' }, { id: 'e3', title: 'Lighting Projects', description: 'Interior, exterior, security, landscape, and showroom lighting.', image: 'https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Start Quote', buttonUrl: '/contact' }] },
    { id: 'electrician-process', type: 'columns', title: 'Simple Service from First Call to Final Test', columns: 3, items: [{ id: 'ecol-1', sections: [{ id: 'eh1', type: 'header', title: 'Tell Us the Issue' }, { id: 'ep1', type: 'paragraph', body: 'Collect the service type, urgency, property details, and preferred appointment time.' }] }, { id: 'ecol-2', sections: [{ id: 'eh2', type: 'header', title: 'Dispatch a Pro' }, { id: 'ep2', type: 'paragraph', body: 'Send a licensed electrician with clear arrival windows and service notes.' }] }, { id: 'ecol-3', sections: [{ id: 'eh3', type: 'header', title: 'Repair and Verify' }, { id: 'ep3', type: 'paragraph', body: 'Show the work, document the fix, and make the next step obvious.' }] }] },
    { id: 'electrician-contact', type: 'contactForm', title: 'Request Electrical Service' }
  ],
  'mowing-business': [
    { id: 'mowing-hero', type: 'hero', title: 'Reliable Lawn Care That Keeps Properties Looking Ready Every Week', body: 'A clean mowing business starter for recurring plans, seasonal services, route areas, photos, and quote requests.', imageUrl: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=1800&q=80', buttonLabel: 'Get a Lawn Quote', buttonUrl: '/contact', secondaryButtonLabel: 'View Plans', secondaryButtonUrl: '#plans' },
    { id: 'mowing-services', type: 'imageCards', title: 'Weekly Mowing, Cleanup, and Curb Appeal', columns: 3, items: [{ id: 'm1', title: 'Weekly Mowing', description: 'Route-based mowing, trimming, edging, and cleanup.', image: 'https://images.unsplash.com/photo-1599685315640-cc6f6b19f9d1?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Start Plan', buttonUrl: '/contact' }, { id: 'm2', title: 'Seasonal Cleanup', description: 'Spring refresh, fall leaves, beds, branches, and debris.', image: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Schedule', buttonUrl: '/contact' }, { id: 'm3', title: 'Commercial Grounds', description: 'Consistent property care for storefronts, offices, and HOAs.', image: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Request Bid', buttonUrl: '/contact' }] },
    { id: 'mowing-plans', type: 'columns', title: 'Plans That Make Lawn Care Easy', columns: 3, items: [{ id: 'mcol-1', sections: [{ id: 'mh1', type: 'header', title: 'Starter' }, { id: 'mp1', type: 'paragraph', body: 'Mowing and trimming for smaller yards and simple weekly service.' }] }, { id: 'mcol-2', sections: [{ id: 'mh2', type: 'header', title: 'Full Care' }, { id: 'mp2', type: 'paragraph', body: 'Mowing, edging, cleanup, seasonal visits, and priority scheduling.' }] }, { id: 'mcol-3', sections: [{ id: 'mh3', type: 'header', title: 'Commercial' }, { id: 'mp3', type: 'paragraph', body: 'Route planning, multi-property service, and easy monthly billing.' }] }] },
    { id: 'mowing-contact', type: 'contactForm', title: 'Request a Lawn Quote' }
  ],
  golf: [
    { id: 'golf-hero', type: 'hero', title: 'Tee Times, Lessons, and Tournament Days in One Clean Club Experience', body: 'A polished golf starter for public tee sheets, memberships, instruction, outings, and clubhouse events.', imageUrl: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1800&q=80', buttonLabel: 'Book a Tee Time', buttonUrl: '/contact', secondaryButtonLabel: 'Explore Memberships', secondaryButtonUrl: '#memberships' },
    { id: 'golf-highlights', type: 'imageCards', title: 'Golf Experiences That Fill the Calendar', columns: 3, items: [{ id: 'g1', title: 'Daily Tee Times', description: 'Promote prime slots, twilight rates, and online booking.', image: 'https://images.unsplash.com/photo-1510160498866-5dae45000ebc?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Reserve', buttonUrl: '/contact' }, { id: 'g2', title: 'Private Lessons', description: 'Highlight instructors, junior clinics, and swing packages.', image: 'https://images.unsplash.com/photo-1592919505780-303950717480?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book Lesson', buttonUrl: '/contact' }, { id: 'g3', title: 'Corporate Outings', description: 'Showcase tournament planning, catering, and event packages.', image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Plan Event', buttonUrl: '/contact' }] },
    { id: 'golf-memberships', type: 'columns', title: 'Membership Options That Feel Clear and Premium', columns: 3, items: [{ id: 'gcol-1', sections: [{ id: 'gh1', type: 'header', title: 'Weekday' }, { id: 'gp1', type: 'paragraph', body: 'Flexible weekday access, range use, and member pricing.' }] }, { id: 'gcol-2', sections: [{ id: 'gh2', type: 'header', title: 'Full Club' }, { id: 'gp2', type: 'paragraph', body: 'Unlimited play, guest perks, and clubhouse invitations.' }] }, { id: 'gcol-3', sections: [{ id: 'gh3', type: 'header', title: 'Junior & Family' }, { id: 'gp3', type: 'paragraph', body: 'Family-friendly access, youth programs, and seasonal events.' }] }] },
    { id: 'golf-contact', type: 'contactForm', title: 'Request Tee Time Info' }
  ],
  cornhole: [
    { id: 'cornhole-hero', type: 'hero', title: 'Leagues, Social Nights, and Big Tournament Energy for Every Throw', body: 'A lively cornhole starter for league signups, venue nights, sponsors, standings, and event registration.', imageUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1800&q=80', buttonLabel: 'Join a League', buttonUrl: '/contact', secondaryButtonLabel: 'See Upcoming Events', secondaryButtonUrl: '#events' },
    { id: 'cornhole-cards', type: 'imageCards', title: 'Everything Needed to Grow the Community', columns: 3, items: [{ id: 'c1', title: 'Weekly Leagues', description: 'Promote recurring nights, divisions, fees, and standings.', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Register', buttonUrl: '/contact' }, { id: 'c2', title: 'Sponsored Tournaments', description: 'Show prize pools, brackets, venue details, and sponsors.', image: 'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Enter Event', buttonUrl: '/contact' }, { id: 'c3', title: 'Private Bookings', description: 'Offer birthdays, company events, and custom board rentals.', image: 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80', buttonLabel: 'Book Night', buttonUrl: '/contact' }] },
    { id: 'cornhole-format', type: 'columns', title: 'Make the Rules, Schedule, and Signup Flow Obvious', columns: 3, items: [{ id: 'ccol-1', sections: [{ id: 'ch1', type: 'header', title: 'Choose Division' }, { id: 'cp1', type: 'paragraph', body: 'Social, competitive, doubles, or bring-your-own-team formats.' }] }, { id: 'ccol-2', sections: [{ id: 'ch2', type: 'header', title: 'Register Players' }, { id: 'cp2', type: 'paragraph', body: 'Collect names, partners, team names, and payment details.' }] }, { id: 'ccol-3', sections: [{ id: 'ch3', type: 'header', title: 'Run the Night' }, { id: 'cp3', type: 'paragraph', body: 'Post brackets, standings, highlights, and sponsor mentions.' }] }] },
    { id: 'cornhole-contact', type: 'contactForm', title: 'Join the Next Event' }
  ]
}

export function cloneDemoStarterSections(slug: string) {
  return JSON.parse(JSON.stringify(demoStarterSections[slug] || [])).map((section: any) => ({ ...section, id: crypto.randomUUID() }))
}
