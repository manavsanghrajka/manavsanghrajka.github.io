/**
 * SchoolGrid — AG Grid wrapper for the medical school comparison table
 * 
 * Features: column pinning, sorting, filtering, custom cell renderers,
 * dynamic computation from global controls, country grouping.
 */

import { useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import PercentileCellRenderer from './PercentileCellRenderer';
import BadgeCellRenderer from './BadgeCellRenderer';
import { checkEligibility, calculateOverallChance } from '../../lib/medDashboard/probabilityEngine';
import { formatScoreForView } from '../../lib/medDashboard/ucatEngine';
import { formatGradeReq, getGradeTooltip } from '../../lib/medDashboard/gradeMapping';
import { convertGbpToCad, formatCurrency } from '../../lib/exchangeRate';

// Register AG Grid community modules
ModuleRegistry.registerModules([AllCommunityModule]);

const SchoolGrid = ({ schools, userProfile, viewMode, feeStatus, fxRate }) => {
  const gridRef = useRef(null);

  // Compute derived row data
  const rowData = useMemo(() => {
    if (!schools?.length) return [];

    return schools.map(school => {
      const hasProfile = userProfile?.ucatScore && userProfile?.top6Avg;

      // Eligibility
      const eligible = hasProfile ? checkEligibility(userProfile, school) : null;

      // Overall Chance
      const chance = hasProfile ? calculateOverallChance(userProfile, school) : null;

      // Tuition calculation (Home is fixed £9250/yr, International inflates ~5% annually)
      let totalTuitionGbp = 0;
      const annualTuition = feeStatus === 'international'
        ? school.annualTuitionIntl
        : school.annualTuitionHome;
        
      const years = school.totalYears || 5;
      
      if (feeStatus === 'international') {
        let currentFee = annualTuition;
        for (let i = 0; i < years; i++) {
          totalTuitionGbp += currentFee;
          currentFee *= 1.05; // 5% annual inflation
        }
      } else {
        // Home fees are government capped and do not compound
        totalTuitionGbp = annualTuition * years;
      }
      
      // Only convert to CAD if international, otherwise leave as null to show GBP
      const totalTuitionCad = (feeStatus === 'international' && fxRate) 
        ? convertGbpToCad(totalTuitionGbp, fxRate) 
        : null;

      // Interview spots for selected fee status
      const intSpots = feeStatus === 'international'
        ? school.interviewSpotsIntl
        : school.interviewSpotsHome;
        
      const totalAppsDisplay = feeStatus === 'international'
        ? school.applicantsIntl
        : school.totalApplicants;
        
      const interviewsDisplay = feeStatus === 'international'
        ? school.interviewsExtendedIntl
        : school.interviewsExtended;
        
      const offersDisplay = feeStatus === 'international'
        ? school.offersGivenIntl
        : school.offersGiven;

      return {
        ...school,
        eligible: eligible === null ? null : (eligible ? 'Yes' : 'No'),
        overallChance: chance?.badge || null,
        overallChanceScore: chance?.score || null,
        totalTuitionCad,
        totalTuitionGbp,
        annualTuition,
        intSpots,
        totalAppsDisplay,
        interviewsDisplay,
        offersDisplay,
        // Pre-format scores for display based on view mode
        ucatCutoffDisplay: school.ucatCutoff,
        ucatAvgInterviewDisplay: school.ucatAvgInterview,
        ucatOfferAvgDisplay: school.ucatOfferAvg,
      };
    });
  }, [schools, userProfile, feeStatus, fxRate]);

  // Column definitions
  const columnDefs = useMemo(() => [
    // === GENERAL ===
    {
      headerName: 'University',
      field: 'university',
      pinned: 'left',
      width: 220,
      filter: 'agTextColumnFilter',
      sortable: true,
      cellStyle: { fontWeight: 600 },
    },
    {
      headerName: 'Course',
      field: 'course',
      width: 130,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      headerName: 'Country',
      field: 'country',
      width: 110,
      filter: 'agTextColumnFilter',
      sortable: true,
    },
    {
      headerName: 'Total Tuition',
      field: 'totalTuitionCad',
      width: 145,
      sortable: true,
      valueGetter: params => {
        return params.data.totalTuitionCad || params.data.totalTuitionGbp;
      },
      valueFormatter: params => {
        if (!params.value) return '—';
        // If they are international, it's CAD (or GBP if fxRate fails). If home, GBP.
        const isInternational = params.context?.userProfile?.feeStatus === 'international';
        // In the rare case fxRate is missing, totalTuitionCad is null, so it falls back to GBP
        const currency = (isInternational && params.data.totalTuitionCad) ? 'CAD' : 'GBP';
        return formatCurrency(params.value, currency);
      },
    },

    // === EVALUATION (placed early for visibility) ===
    {
      headerName: 'Eligibility',
      field: 'eligible',
      width: 100,
      sortable: true,
      cellRenderer: BadgeCellRenderer,
    },
    {
      headerName: 'Overall Chance',
      field: 'overallChance',
      width: 150,
      sortable: true,
      comparator: (a, b) => {
        const order = ['High Chance', 'Highly Competitive', 'Competitive', 'Borderline', 'Unlikely'];
        return (order.indexOf(a) || 99) - (order.indexOf(b) || 99);
      },
      cellRenderer: BadgeCellRenderer,
    },

    // === UCAT & SJT ===
    {
      headerName: 'UCAT Cutoff',
      field: 'ucatCutoffDisplay',
      width: 115,
      sortable: true,
      cellRenderer: PercentileCellRenderer,
    },
    {
      headerName: 'UCAT Avg. Int.',
      field: 'ucatAvgInterviewDisplay',
      width: 125,
      sortable: true,
      cellRenderer: PercentileCellRenderer,
    },
    {
      headerName: 'UCAT Offer Avg.',
      field: 'ucatOfferAvgDisplay',
      width: 135,
      sortable: true,
      cellRenderer: PercentileCellRenderer,
    },
    {
      headerName: 'Min. SJT',
      field: 'minSjtBand',
      width: 90,
      sortable: true,
      valueFormatter: params => params.value ? `Band ${params.value}` : '—',
    },

    // === ADMISSIONS ===
    {
      headerName: 'Add. Method',
      field: 'admissionMethod',
      width: 280,
      filter: 'agTextColumnFilter',
      cellClass: 'admission-cell',
      autoHeight: true,
      wrapText: true,
      cellStyle: { whiteSpace: 'normal', lineHeight: '1.3', fontSize: '0.7rem' },
    },
    {
      headerName: 'Interview',
      field: 'interviewStyle',
      width: 95,
      sortable: true,
      cellRenderer: BadgeCellRenderer,
    },
    {
      headerName: 'Int. Spots',
      field: 'intSpots',
      width: 95,
      sortable: true,
      valueFormatter: params => params.value != null ? params.value.toLocaleString() : '—',
    },
    {
      headerName: 'Offers',
      field: 'offersDisplay',
      width: 80,
      sortable: true,
      valueFormatter: params => params.value != null ? params.value.toLocaleString() : '—',
    },
    {
      headerName: 'Interviews',
      field: 'interviewsDisplay',
      width: 95,
      sortable: true,
      valueFormatter: params => params.value != null ? params.value.toLocaleString() : '—',
    },
    {
      headerName: 'Applicants',
      field: 'totalAppsDisplay',
      width: 100,
      sortable: true,
      valueFormatter: params => params.value != null ? params.value.toLocaleString() : '—',
    },

    // === GRADES ===
    {
      headerName: 'Grade Req.',
      field: 'gradeReqOssd',
      width: 110,
      sortable: true,
      cellRenderer: params => {
        if (!params.value) return <span className="no-data">—</span>;
        
        const notes = params.data?.ossdNotes || '';
        if (!notes) return <span>{params.value}%</span>;
        
        const isStrict = notes.toLowerCase().includes('not accepted') || 
                         notes.toLowerCase().includes('not sufficient') || 
                         notes.toLowerCase().includes('highly competitive');
        
        const icon = isStrict ? '🚨' : '⚠️';
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{params.value}%</span>
            <span 
              style={{ cursor: 'help', fontSize: '11px' }}
              title={notes}
            >
              {icon}
            </span>
          </div>
        );
      },
      tooltipValueGetter: params => {
        return getGradeTooltip(params.data?.gradeReqALevel, params.data?.gradeReqOssd, params.data?.ossdNotes);
      },
    },

    // === SOURCES ===
    {
      headerName: 'Source',
      field: 'sourceStatus',
      width: 110,
      sortable: true,
      cellRenderer: BadgeCellRenderer,
    },
    {
      headerName: 'Official URL',
      field: 'officialUrl',
      width: 130,
      cellRenderer: params => {
        if (!params.value) return <span className="no-data">—</span>;
        return (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            className="link-cell"
            onClick={e => e.stopPropagation()}
          >
            Visit →
          </a>
        );
      },
    },
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    wrapText: true,
    autoHeight: true,
    wrapHeaderText: true,
    autoHeaderHeight: true,
    suppressMovable: false,
  }), []);

  const gridContext = useMemo(() => ({
    userProfile,
    viewMode,
  }), [userProfile, viewMode]);

  return (
    <div className="med-grid-wrapper" style={{ width: '100%' }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        context={gridContext}
        animateRows={true}
        pagination={false}
        domLayout="autoHeight"
        headerHeight={40}
        suppressCellFocus={true}
        enableCellTextSelection={true}
        tooltipShowDelay={300}
      />
    </div>
  );
};

export default SchoolGrid;
