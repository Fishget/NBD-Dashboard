
import type { SheetRow } from '@/lib/types';
import { getSheetData } from '@/lib/sheets';
import { DashboardTable } from '@/components/dashboard-table';
import { AlertTriangle, ServerCrash, InfoIcon } from 'lucide-react';

// This is now a Server Component
export default async function AdminDashboardDisplayWrapper() {
  let tableData: SheetRow[] = []; // Default to empty array
  let errorOccurred = false; // General API or unexpected error
  let isConfigError = false; // Specific flag for configuration errors
  let userFriendlyMessage = "Live Dashboard Preview from Google Sheet.";


  try {
    const dataResult = await getSheetData();

    if (dataResult === null) {
      isConfigError = true;
      userFriendlyMessage = "CRITICAL CONFIGURATION ERROR: Could not connect to Google Sheets. Please ensure GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and a valid GOOGLE_PRIVATE_KEY are correctly set in your environment variables and the server has been restarted. Check server logs for '[SheetLib:]' messages for details.";
      tableData = [];
    } else {
      tableData = Array.isArray(dataResult) ? dataResult : [];
      if (tableData.length === 0) {
        userFriendlyMessage = "No data available in the Google Sheet for preview, or the sheet is empty. If this is unexpected, verify the sheet contents and API configuration (Sheet ID, Range, Permissions). Check server logs if an API error was logged by [SheetLib:getSheetData].";
      }
    }
  } catch (error: any) {
    console.error("[AdminDashboardDisplayWrapper SC] Unexpected error fetching data for admin dashboard:", error);
    errorOccurred = true;
    userFriendlyMessage = `An unexpected error occurred while fetching data: ${error.message || 'Unknown error'}. Please check server logs.`;
    tableData = [];
  }

  if (isConfigError) {
    return (
        <div className="my-4 p-4 border border-destructive/50 rounded-md bg-destructive/10">
            <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-8 w-8" />
                <div>
                    <p className="font-semibold">Configuration Error Loading Preview</p>
                    <p className="text-sm">
                        {userFriendlyMessage}
                    </p>
                </div>
            </div>
        </div>
    );
  }

  if (errorOccurred) {
    return (
        <div className="my-4 p-4 border border-destructive/20 rounded-md bg-destructive/10">
            <div className="flex items-center gap-3 text-destructive">
                <ServerCrash className="h-8 w-8" />
                <div>
                    <p className="font-semibold">Error Fetching Dashboard Preview Data</p>
                    <p className="text-sm">
                        {userFriendlyMessage}
                    </p>
                </div>
            </div>
        </div>
    );
  }

  if (tableData.length === 0 && !isConfigError && !errorOccurred) {
    return (
         <div className="my-4 p-4 border border-dashed border-border rounded-md bg-muted/50">
            <div className="flex items-center gap-3 text-muted-foreground">
                <InfoIcon className="h-8 w-8 text-primary" />
                <div>
                    <p className="font-semibold text-card-foreground">No Data for Preview</p>
                    <p className="text-sm">
                       {userFriendlyMessage}
                    </p>
                </div>
            </div>
        </div>
    );
  }

  return <DashboardTable initialData={tableData} isEditable={true} />;
}
