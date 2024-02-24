import { IRepresentation } from "./types";

type UrlTemplateIdentifier = {
  representationId: string; // $RepresentationID$
  number: number;           // $Number$
  bandwidth: number;        // $Bandwidth$
  time: number;             // $Time$
  subNumber: number;        // $SubNumber$
}

/**
 * A collection of utility methods to parse MPEG-DASH manifests.
 */
export class ParserUtils {

  static parseXml (data: string) : Element | null {
    let parser = new DOMParser();
    let xml = parser.parseFromString(data, 'text/xml');

    if (xml && xml.documentElement.tagName === 'MPD') {
      return xml.documentElement;
    }

    return null;
  }


  static getChildren (node: Node, tagName: string) : Element[] {
    const childElements = [];
    for (const child of node.childNodes) {
      if (child instanceof Element && child.tagName === tagName) {
        childElements.push(child);
      }
    }
    return childElements;
  }


  static getFirstChild (node: Node, tagName: string) : Element | null {
    const children = ParserUtils.getChildren(node, tagName);
    return children?.[0] || null;
  }


  static parseIsoDuration (durationString: string) : number | null {
    const secondsInYear = 365 * 24 * 60 * 60;
    const secondsInMonth = 30 * 24 * 60 * 60;
    const secondsInDay = 24 * 60 * 60;
    const secondsInHour = 60 * 60;
    const secondsInMinute = 60;

    if (!durationString) {
      return null;
    }

    const regex = /^([-])?P(([\d.]*)Y)?(([\d.]*)M)?(([\d.]*)D)?T?(([\d.]*)H)?(([\d.]*)M)?(([\d.]*)S)?/;
    const match = regex.exec(durationString);

    let duration = (parseFloat(match?.[2] || '0') * secondsInYear +
        parseFloat(match?.[4] || '0') * secondsInMonth +
        parseFloat(match?.[6] || '0') * secondsInDay +
        parseFloat(match?.[8] || '0') * secondsInHour +
        parseFloat(match?.[10] || '0') * secondsInMinute +
        parseFloat(match?.[12] || '0'));

    if (typeof match?.[1] !== 'undefined') {
      duration = -duration;
    }

    return duration;
  }


  static parseDate (dateString: string) : number | null {
    if (!dateString) {
      return null;
    }

    // Make sure to use UTC time instead of local time zone
    if (!dateString.endsWith('Z')) {
      dateString += 'Z';
    }

    const result = Date.parse(dateString);
    return (!isNaN(result) ? Math.floor(result / 1000.0) : null);
  }


  static resolveTemplateUrl (
      url: string,
      identifiers: Partial<UrlTemplateIdentifier>,
      baseUrl?: string) : string {

    let resolvedTemplate = url;

    if (identifiers.representationId) {
      resolvedTemplate = resolvedTemplate.replace(
          '$RepresentationID$', String(identifiers.representationId));
    }

    if (identifiers.number) {
      resolvedTemplate = resolvedTemplate.replace(
          '$Number$', String(identifiers.number));
    }

    if (identifiers.subNumber) {
      resolvedTemplate = resolvedTemplate.replace(
          '$SubNumber$', String(identifiers.number));
    }

    if (identifiers.bandwidth) {
      resolvedTemplate = resolvedTemplate.replace(
          '$Bandwidth$', String(identifiers.bandwidth));
    }

    if (identifiers.time) {
      resolvedTemplate = resolvedTemplate.replace(
          '$Time$', String(identifiers.time));
    }

    if (baseUrl?.startsWith('http')) {
      resolvedTemplate = new window.URL(resolvedTemplate, baseUrl).href;
    }

    return resolvedTemplate;
  }


  static getTypeFromMimeType (mimeType: string) : string {
    if (!mimeType) {
      return '';
    }

    return mimeType.split('/')[0] || '';
  }


  static getFullMimeType (stream: IRepresentation) : string {
    let fullMimeType = stream.mimeType;
    if (stream.codecs) {
      fullMimeType += '; codecs="' + stream.codecs + '"';
    }
    return fullMimeType;
  }
}
