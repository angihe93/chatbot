export type TicketLink = {
    source: string;
    link: string;
    fav_icon: string;
};

export type InfoLink = {
    source: string;
    link: string;
} | null;

export type Venue = {
    google_id: string;
    name: string;
    phone_number: string | null;
    website: string | null;
    review_count: number;
    rating: number | null;
    subtype: string;
    subtypes: string[];
    full_address: string;
    latitude: number;
    longitude: number;
    district: string;
    street_number: string | null;
    street: string | null;
    city: string;
    zipcode: string;
    state: string;
    country: string;
    timezone: string;
    google_mid: string;
};

export type Event = {
    event_id: string;
    name: string;
    link: string;
    description: string;
    language: string;
    date_human_readable: string;
    start_time: string;
    start_time_utc: string;
    start_time_precision_sec: number;
    end_time: string;
    end_time_utc: string;
    end_time_precision_sec: number;
    is_virtual: boolean;
    thumbnail: string | null;
    publisher: string;
    publisher_favicon: string;
    publisher_domain: string;
    ticket_links: TicketLink[];
    info_links: InfoLink[];
    venue: Venue;
};

export enum DateType {
    any = "any",
    today = "today",
    tomorrow = "tomorrow",
    week = "week",
    weekend = "weekend",
    next_week = "next_week",
    month = "month",
    next_month = "next_month"
}

export type EventSearchParams = {
    start?: number,
    query: string,
    date?: DateType,
    is_virtual?: boolean
}

export type EventSearchResponse = {
    status: string;
    request_id: string;
    parameters: EventSearchParams;
    data: Event[];
};