import { Calendar, User, Hash, FileText, Link as LinkIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type { SearchFilters as SearchFiltersType } from "@/services/search";
import { format } from "date-fns";

interface SearchFiltersProps {
	filters: SearchFiltersType;
	onFiltersChange: (filters: SearchFiltersType) => void;
}

export function SearchFilters({ filters, onFiltersChange }: SearchFiltersProps) {
	const updateFilter = <K extends keyof SearchFiltersType>(
		key: K,
		value: SearchFiltersType[K]
	) => {
		onFiltersChange({ ...filters, [key]: value });
	};

	return (
		<div className="p-4 border rounded-lg space-y-4">
			<div className="grid grid-cols-2 gap-4">
				{/* Content Type */}
				<div>
					<Label className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Content Type
					</Label>
					<Select
						value={filters.contentType || "all"}
						onValueChange={(value) =>
							updateFilter("contentType", value === "all" ? undefined : value as any)
						}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="text">Text</SelectItem>
							<SelectItem value="file">File</SelectItem>
							<SelectItem value="gif">GIF</SelectItem>
							<SelectItem value="link">Link</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Has File */}
				<div>
					<Label className="flex items-center gap-2">
						<FileText className="h-4 w-4" />
						Has File
					</Label>
					<Select
						value={filters.hasFile ? "yes" : "no"}
						onValueChange={(value) => updateFilter("hasFile", value === "yes")}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="no">Any</SelectItem>
							<SelectItem value="yes">Has File</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Has Link */}
				<div>
					<Label className="flex items-center gap-2">
						<LinkIcon className="h-4 w-4" />
						Has Link
					</Label>
					<Select
						value={filters.hasLink ? "yes" : "no"}
						onValueChange={(value) => updateFilter("hasLink", value === "yes")}>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="no">Any</SelectItem>
							<SelectItem value="yes">Has Link</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Date From */}
				<div>
					<Label className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						From Date
					</Label>
					<Input
						type="date"
						value={
							filters.dateFrom
								? format(filters.dateFrom, "yyyy-MM-dd")
								: ""
						}
						onChange={(e) =>
							updateFilter("dateFrom", e.target.value ? new Date(e.target.value) : undefined)
						}
					/>
				</div>

				{/* Date To */}
				<div>
					<Label className="flex items-center gap-2">
						<Calendar className="h-4 w-4" />
						To Date
					</Label>
					<Input
						type="date"
						value={
							filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""
						}
						onChange={(e) =>
							updateFilter("dateTo", e.target.value ? new Date(e.target.value) : undefined)
						}
					/>
				</div>
			</div>
		</div>
	);
}

