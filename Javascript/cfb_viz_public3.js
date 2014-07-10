
var dataset;
var teams;
var formations;
var pieLocations=[];
var playsGraph=[];
var totalPlays;
var sampleTeamData;
var formationData;
var pieContainers;
var padding=50;
var vertPadding=100;
var graphSpacing=150;
var maxRadius=graphSpacing*.7;
var numTeams=4;
var buttonHeight=50;
var buttonWidth=125;
var buttonRound=15;

var color = d3.scale.category10();


get_unique = function(array) {
    return_array=[]
    for (j=0;j<array.length;j++){
        if (return_array.indexOf(array[j])<0){
            return_array.push(array[j]);
        }
     }
     return return_array;
}

updateGraph = function(d) {
    sampleTeamData=dataset;
    if (d!='All Teams') {
    sampleTeamData=dataset.filter(function(allData) {return allData.Team==d;});
    }
    totalPlays=d3.sum(sampleTeamData,function(d){return d.Plays});
    pieLocations.forEach(function(d) {
        d.graphData=[];
        d.radius=0;
        localTeamData=sampleTeamData.filter(function(allData){return (allData.Backs==d.Backs)&(allData.Wide==d.WR);});
        localPlays=0;
        localPlays=d3.sum(localTeamData,function(d){return d.Plays});
        localGraphRadius=maxRadius*Math.sqrt(localPlays/totalPlays);
        localGraphData=[];
        for (k=0;k<formations.length;k++)
        {
            formationData=localTeamData.filter(function(allData){return allData.Gun==formations[k];})
            if (formationData.length==0){
                localGraphData.push({Formation:formations[k],Plays:0,GraphRadius:localGraphRadius});
                }
            else {
                    localGraphData.push({Formation:formations[k],Plays:formationData[0].Plays,GraphRadius:localGraphRadius});
                }
       
        }  
        d.graphData=localGraphData;
        d.radius=maxRadius*Math.sqrt(localGraphRadius/totalPlays);
    });

    pieLocations.forEach(function(d){
    if (d.radius==0) {d.graphData.forEach(function(d2){d2.Plays=1;});} //Puts in fake path data for pie charts with no plays, to avoid pathing data
    });
}
    var xScale=d3.scale.linear().domain([0,5]).range([0,graphSpacing*5]);
    var yScale=d3.scale.linear().domain([0,3]).range([graphSpacing*3,0]);
    var xAxis=d3.svg.axis().scale(xScale).orient('bottom').ticks(5);
    var yAxis=d3.svg.axis().scale(yScale).orient('left').ticks(3);
    var pie = d3.layout.pie()
                .sort(null)
                .value(function(d){return d.Plays;});  //Takes graphData as input
    var arc = d3.svg.arc()
                .outerRadius(function(d) {return d.data.GraphRadius;});

d3.csv("http://www.colindavy.com/cfb/data/exports2_stack.csv", function(error, data) {

    dataset=data;
    objKeys=d3.keys(data[0]);
    allTeams=[];
    allFormations=[];
    data.forEach(function(d) {d.Backs=+d.Backs;d.Wide=+d.Wide;d.Plays=+d.Plays});  //Converts to decimal number
    for (k=0;k<data.length;k++){
        allTeams.push(data[k].Team)
        allFormations.push(data[k].Gun)
    }
    teams=get_unique(allTeams);
    //teams.push('All Teams')
    formations=get_unique(allFormations);
    color.domain(formations);

    for (i=0;i<6;i++){
        for (j=0;j<4;j++){
                pieLocations.push({WR:i,Backs:j,graphData:[],radius:0});
        }
    }

    initialTeam='Texas'
    updateGraph(initialTeam);


//var svgContainer=d3.select('body').append('svg').attr('width',2000).attr('height',1000);
var div = d3.select('body').append('div').attr('class','tooltip').style('opacity',0);
//Draw the pie charts
pieContainers =d3.select('.cdavy').selectAll('.chartMarker').data(pieLocations)
                .enter().append('g')
                .attr('class','chartMarker')
                .attr('transform',function(d)
                    {return 'translate('+(padding+d.WR*graphSpacing)+','+(vertPadding+graphSpacing*3-((d.Backs*graphSpacing)))+')';})

var pieCharts=pieContainers
            .selectAll('.arc').data(function(d) {return pie(d.graphData);})
            .enter()
            .append('path')
            .attr('class','arc')
            .attr('d',arc)
            .style('fill',function(d){return color(d.data.Formation);})
            .on('mouseover',function(d){
             div.transition().duration(0).style('opacity',.9);
             d3.select(this).attr('stroke','yellow').attr('stroke-width','2px');

             div.html(Math.round(d.value*1000/totalPlays)/10+'% of Total Plays').style('left',(d3.event.pageX)+'px').style('top',(d3.event.pageY-28)+'px');
            })
            .on('mouseout',function(d){
                div.transition().duration(0).style('opacity',0);
                d3.select(this).attr('stroke-width','0px');

            })
            .each(function(d) { this._current = d; })
            ;

var legend = d3.select('.cdavy').selectAll('.legendMarkers').data(formations)
            .enter().append('g').attr('class','legendMarkers')
            .attr('transform',function(d,i){return 'translate('+(padding+graphSpacing*4.5)+','+(vertPadding+i*20)+')';});

    legend.append('rect').attr('width',18).attr('height',18).style('fill',color);
      legend.append("text")
      .attr("x", 24)
      .attr("y", 9)
      .attr("dy", ".35em")
      .text(function(d) { return d; });

//Draw the team buttons

var buttons = d3.select('.cdavy').selectAll('.teamButton').data(teams)
                .enter().append('g')
                .attr('class','teamButton')
                .attr('id',function(d){return d;})
                .attr('transform', function(d, i){return 'translate('+
                ((padding*2+graphSpacing*5+buttonWidth*(i%numTeams)))+','+(50+buttonHeight*(Math.floor(i/numTeams)))+')'})
                .on('click',function(d) 
                {
                    d3.selectAll('.teamButton').selectAll('rect').attr('fill','white');
                    d3.selectAll('.teamButton').selectAll('text').attr('fill','black');
                    d3.select(this).select('rect').attr('fill','#536267');
                    d3.select(this).select('text').attr('fill','white');
                    updateGraph(d);
                    pie.value(function(d) {return d.Plays;});
                    pieCharts = pieContainers
                    .selectAll('.arc')
                    .data(function(d) {return pie(d.graphData);})
                    .transition().duration(750).attrTween("d", arcTween);
                 }
            );

var teamLabels= buttons.append('rect').data(teams)
                .attr('class','buttonRect')
                .attr('width',buttonWidth)
                .attr('height',buttonHeight)
                .attr('rx',buttonRound)
                .attr('ry',buttonRound)
                .attr('fill','white')
                .attr('stroke-width',0);


var buttonText= buttons.append('text').data(teams)
                .text(function(d) {return d;})
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr('x',(buttonWidth)/2)
                .attr('y',(buttonHeight+4)/2)
                .attr('text-anchor','middle')
                //.attr('transform',function(d){return 'translate('+(30-(1.0*d.length))+',30)';})
                .attr("fill", "black");
var textShield=buttons.append('rect').data(teams)
                .attr('class','buttonRect')
                .attr('width',buttonWidth)
                .attr('height',buttonHeight)
                .attr('opacity',0);

//Set initial coloring of button
d3.select('.cdavy').selectAll('#'+initialTeam).select('rect').attr('fill','#536267');
d3.select('.cdavy').selectAll('#'+initialTeam).select('text').attr('fill','white');

var x_axis=d3.select('.cdavy').append('g').call(xAxis)
.attr('class','axis')
.attr('transform','translate('+padding+','+(vertPadding+(graphSpacing*3))+')');

var y_axis=d3.select('.cdavy').append('g')
.call(yAxis)
.attr('class','axis')
.attr('transform','translate('+padding+','+(vertPadding)+')');

d3.select('.cdavy').append('text').attr('text-anchor','middle').text('Wide Receivers')
.attr('transform','translate('+(padding+graphSpacing*2.5)+','+(vertPadding+(graphSpacing*3)+40)+')');

d3.select('.cdavy').append('text').attr('text-anchor','middle').text('Backs')
.attr('transform','translate('+(padding/2)+','+(vertPadding+(graphSpacing*1.5))+') rotate(270)');




    });//This is the end of the callback function in d3.csv


function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  }};
