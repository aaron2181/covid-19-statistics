import MapCanada from './MapCanada';
import Button from '@material-ui/core/Button';
import '../styles/App.css'

import React, { useState, useEffect } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import axios from 'axios';
import _ from 'lodash';

import ReactEcharts from 'echarts-for-react';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';

const columns = [
  { label: "Province", id: "Province", align: 'left', maxWidth: 10},
  { label: "Tested", id: "Tests", align: 'right', maxWidth: 10 },
  { label: "Conf.", id: "Conf.", align: 'right', maxWidth: 10 },
  { label: "New", id: "New", align: 'right', maxWidth: 10 },
  { label: "Pres.", id: "Pres.", align: 'right', maxWidth: 10 },
  { label: "Total", id: "Total", align: 'right', maxWidth: 10 },
  { label: "Cases/1M", id: "Per m", align: 'right', maxWidth: 10 },
  { label: "Cured", id: "Recov.", align: 'right', maxWidth: 10 },
  { label: "Deaths", id: "Deaths", align: 'right', maxWidth: 10 },
  { label: "Active", id: "Active", align: 'right', maxWidth: 10 },
];

const StyledTableCell = withStyles(theme => ({
  head: { fontWeight: 600 },
  body: { fontSize: 14, },
}))(TableCell);

const isWideScreen = () => {
    console.log('screen change')
  let mediaQuery = window.matchMedia("(orientation: portrait)");
  if(mediaQuery.matches) { return false };

  if(document.body.clientWidth < 1024) { return false; }

  return true;
}

const useStyles = makeStyles({
  root: { width: '100%', }, container: { maxHeight: "84vh" },
  chart: {marginTop: '2.5%'},
  switch: {
    display: 'flex', // : 'none',
    position: 'absolute',  // fixed button will not move when scroll the page
    top: isWideScreen() ? '6.6rem' : '8.0rem',
    marginLeft: '1.5rem', 
    // height: '2.2rem',
    // backgroundSize: '100% auto',
    zIndex: 9999,
    // webkitTransition: 'opacity .3s ease',
  }
});

function TableTitle () {
  return (
    <div className="canadaTableTitle" style={{top: 0}}>
      <div>Cases Detail by Province in Canada Today</div>
      <div className="subTitle" >Data from https://en.wikipedia.org/wiki/2020_coronavirus_outbreak_in_Canada</div>
    </div>
  )
}

const valueFormat = (value) => {
  return (value || '0').toString().replace(/(\d{1,3})(?=(?:\d{3})+(?!\d))/g, '$1,');
}

function ProvincesTable ({data}) {
  const classes = useStyles();

  return (
    <Paper className={classes.root} elevation={0} >
      <TableContainer className={classes.container}>
        <Table stickyHeader aria-label="sticky table" size="small">
          <TableHead >
            <TableRow>
              {columns.map(column => (
                <StyledTableCell key={column.id} align={column.align} style={{ minWidth: column.minWidth }}>
                  {column.label}
                </StyledTableCell> )
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map( (row, index) => {
              return (
                <TableRow hover role="checkbox" tabIndex={-1} key={row.Province}>
                  {columns.map(column => {
                    let value = valueFormat(row[column.id]);
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format && typeof value === 'number' ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
                );
            })}
          </TableBody>
        </Table>
      </TableContainer>

    </Paper>
  );
};

// Line Chart
function CasesHisTrend ({days, dayCases, dayNewCases}) {

  const [loaded, setReady] = useState(false);
  const getLoadingOption = () => {
    return { text: 'Data Loading ...' };
  };

  const onChartReady = (chart) => {
    if(days && Array.isArray(dayCases)) {
      setReady(true);
      setTimeout(() => { chart.hideLoading(); }, 1000); 
    }
  };

  const getOption = () => {
    return {
      title: {
          x: 'center',
          text: 'Accumulated Cases by day in Canada',
      },
      tooltip: { 
        trigger: 'axis',
      },
      legend: {
          // data: ['Confirmed', 'Suspected', 'Increased', 'Recovered', 'Deaths'], // four curves
          data: ['Confirmed', 'Presumptive', 'New Cases'], // 2 line curves, 1 bar
          top : '30px',
          textStyle: {fontSize: 12, fontWeight: 600},
      },
      grid: { left: 'center', right: 'center', bottom: '3%', containLabel: true, width: '85%' },
      toolbox: { feature: { saveAsImage: {} } },
      xAxis: {
          type: 'category',
          boundaryGap: false,
          data: days
      },
      yAxis: [
        {
          type: 'value'
        },
        {
          type: 'value',
          splitLine: { show: false, },          
        },
      ],
      series: [
          {
              name: 'Confirmed',
              type: 'line',
              // stack: 'Toll',
              data: dayCases && dayCases.map( 
                  dayProvCases => dayProvCases.reduce((total, curProv) => {
                    return total = parseInt(total) + parseInt(curProv.value || 0); 
                }, [0]))
          },
          {
              name: 'Presumptive',
              type: 'line',
              // stack: 'Toll',
              data: dayCases && dayCases.map( 
                dayProvCases => dayProvCases.reduce((total, curProv) => {
                  return total = parseInt(total) + parseInt(curProv.suspect || 0); 
              }, [0]))
          },
          {
            name: 'New Cases',
            type: 'bar',        
            yAxisIndex: 1,
            itemStyle: { color: '#ffc0b1', }, // change default bar color
            data: dayNewCases
        }
      ]
    };
  }

  return (
    (days && dayCases) ? (
      <ReactEcharts 
        style={{height: "30vh"}}
        echarts={echarts}
        option={getOption()}
        loadingOption={getLoadingOption()}
        onChartReady={onChartReady}
        showLoading={!loaded}  //official showloading always have bugs 
        notMerge={true}
        lazyUpdate={true}
        theme={"theme_name"}
      />
    ) : <></>
  )
}

export default function Canada() {

  const [hisCases, setCases] = useState({dates: [], cases: []});
  const [provDetails, setDetail] = useState([]);
  const [viewMode, setMode] = useState('map');

  let classes = useStyles();

  const handleSwitch = () => {
    if(viewMode === 'map') setMode('table');
    else setMode('map');    
  }

  useEffect(() => {

    let isCanceled = false;
    try {
      axios.get(`./assets/CanadaCasesDb.json`).then( ({data}) => {

        if(!isCanceled) {
          let dayCases = data.cases.map(day => day.cases); // cases for each province by day
          let dailyTotalCases = dayCases.map( 
            dayProvCases => dayProvCases.reduce((total, curProv) => {
              return total = parseInt(total) + parseInt(curProv.value || 0); 
          }, [0]));
          let dailyNewCases = dailyTotalCases.map((number, index) => {
            return (index === 0) ? number : number - dailyTotalCases[index - 1];
          });

          // get new cases number by province of today
          let today = dayCases[dayCases.length - 1];
          let yesterday = dayCases[dayCases.length - 2];
          let provNewCases = {}; // new cases by province
          today.forEach( ({name}, index) => {
            provNewCases[name] = today[index].value - yesterday[index].value;
          });
          
          // hisDataObj is used for line & bar chart
          let hisDataObj = {
              dates: data.cases.map(day => day.date),  // xAxis: dates array
              cases: dayCases,  // YAxis 0
              dailyNewCases: dailyNewCases // YAxis 1
          };
          setCases(hisDataObj);

          let allData = data.details;
          let canada = allData.pop();
          let tmp = _.sortBy(allData, (o) => parseInt(o.Total)).reverse();
          let tmpInsertNew = tmp.map( p => {
            p["New"] = provNewCases[p.Province];
            return p;
          });
          canada["New"] = Object.values(provNewCases).reduce((total, newCases) => {
            return total = parseInt(total) + parseInt(newCases || 0); 
          }, [0]);
          tmpInsertNew.push(canada);
          tmpInsertNew.forEach((item, index, array) => {
            if(item["New"] > 0) tmpInsertNew[index]["New"] = '+' + item["New"];
          });
          // console.log(provNewCases, tmpInsertNew)
          setDetail(tmpInsertNew);  // for table's rows
        }
      });
    } catch (error) {
      console.log(`'Error in get today's case details:`, error)
    }
    return () => {isCanceled = true;}
  }, []);

  switch(viewMode) {
    case 'map': 
      return (
        <>
          <Button variant="outlined" size="small" color="primary" className={classes.switch} 
                  style={{top: isWideScreen() ? '6.6rem' : '8.0rem'}}
                  onClick={handleSwitch} > View Table
          </Button>
          <MapCanada hisCases={hisCases} />
        </>);

    case 'table':
      return (
        <div>        
          <Button variant="outlined" size="small" color="primary" className={classes.switch}
                  style={{top: isWideScreen() ? '6.6rem' : '8.0rem'}}
                  onClick={handleSwitch} > View Map
          </Button>
          <div style={{margin:'0 1rem 1.5rem 1rem'}}> 
            <TableTitle style={{display: 'flex'}}/>
            <ProvincesTable style={{width: '90%'}} data={provDetails} />
          </div>
          {/* <div className={classes.chart} style={{display: 'flex'}}> */}
            <CasesHisTrend 
              days={hisCases.dates} 
              dayCases={hisCases.cases} 
              dayNewCases={hisCases.dailyNewCases} 
            />
          {/* </div> */}
        </div>
      );
    default: return (<></>);
  }
}