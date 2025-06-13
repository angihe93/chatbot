import type { TicketLink, InfoLink, Venue, Event, DateType, EventSearchParams, EventSearchResponse } from './eventsApiTypes'

const apiKey = process.env.EVENT_SEARCH_API_KEY
console.log(apiKey)

export default function getEvents(params: EventSearchParams): Promise<EventSearchResponse> {
    const url = "https://zylalabs.com/api/4798/google+event+search+api/5973/search+events"
    // const queryString = new URLSearchParams(params as any).toString()
    const queryString = new URLSearchParams(
        Object.fromEntries(
            Object.entries(params).map(([key, value]) => [key, String(value)])
        )
    ).toString()
    return fetch(`${url}?${queryString}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    }).then(res => res.json());
}