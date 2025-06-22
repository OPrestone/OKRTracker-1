import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function slugify(str: string): string {
	str = str.replace(/^\s+|\s+$/g, ""); // trim leading/trailing white space
	str = str.toLowerCase(); // convert string to lowercase
	str = str
		.replace(/[^a-z0-9 -]/g, "") // remove any non-alphanumeric characters
		.replace(/\s+/g, "-") // replace spaces with hyphens
		.replace(/-+/g, "-"); // remove consecutive hyphens
	return str;
}

export function isValidULID(id: string): boolean {
	return /^[0-9A-HJKMNP-TV-Z]{26}$/i.test(id);
}

export function getPathWithoutUlid(path: string): string {
	// Remove the last segment if it is a valid ULID
	const segments = path.split("/");
	if (segments.length > 0) {
		const firstSegment = segments[0];
		if (isValidULID(firstSegment)) {
			segments.pop();
		}
	}
	return segments.join("/");
}
