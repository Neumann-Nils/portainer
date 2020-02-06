function calculateCPUGrade(cpuUsage)
{
    //CPU grade can have a value between 0 and 600 (0 = very good, 600 = very bad)
    var cpuGrade = {};
    cpuGrade.score = 0.0;
    cpuGrade.color = "#00bb00";

    //CPU usage below 50% is not critical
    //Do not grade cpu usage spike that hard (e.g. last minute usage)
    if(cpuUsage.LastMin > 50)
    {
        if(cpuUsage.LastMin <= 60) {
            cpuGrade.score = 10;
            cpuGrade.color = "#66bb00";
        } else if(cpuUsage.LastMin <= 70){
            cpuGrade.score = 25;
            cpuGrade.color = "#bbaa00";
        } else if(cpuUsage.LastMin <= 80){
            cpuGrade.score = 50;
            cpuGrade.color = "#bb4400";
        } else if(cpuUsage.LastMin <= 90){
            cpuGrade.score = 100;
            cpuGrade.color = "#bb0000";
        }
        else {
            cpuGrade.score = 150;
            cpuGrade.color = "#ff0000";
        }

        //Is the cpu usage of the last minute and last five minutes are high
        //signal the user, there may something wrong
        if(cpuUsage.LastFiveMin > 50)
        {
            cpuGrade.score *= 2;

            //Is the cpu usage of the last minute, the last five minutes and
            //the last fifteen minutes is high there is definitely something wrong!
            if(cpuUsage.LastFifteenMin > 50) {
                cpuGrade.score *= 2;
            }
        }
    }

    return cpuGrade;
}

function calculateRAMGrade(ramUsage)
{
    //RAM grade can have a value between 0 and 600 (0 = very good, 600 = very bad)
    var ramGrade = {};
    ramGrade.score = 0.0;
    ramGrade.color = "#00bb00";

    //RAM usage below 50% is not critical
    if(ramUsage > 50)
    {
        if(ramUsage <= 60) {                //51-60%
            ramGrade.score = 75;
            ramGrade.color = "#66bb00";
        } else if(ramUsage <= 70){          //61-70%
            ramGrade.score = 150;
            ramGrade.color = "#bbaa00";
        } else if(ramUsage <= 80){          //71-80%
            ramGrade.score = 250;
            ramGrade.color = "#bb4400";
        } else if(ramUsage <= 90){          //81-90%
            ramGrade.score = 300;
            ramGrade.color = "#bb4400";
        }
        else {                              //91-100%
            ramGrade.score = 600;
            ramGrade.color = "#ff0000";
        }
    }

    return ramGrade;
}

function calculateDiskGrade(diskUsage)
{
    //Disk grade can have a value between 0 and 600 (0 = very good, 600 = very bad)
    var diskGrade = {};
    diskGrade.score = 0.0;
    diskGrade.color = "#00bb00";

    //Disk usage below 50% is not critical
    if(diskUsage > 50)
    {
        if(diskUsage <= 60) {               //51-60%
            diskGrade.score = 25;
            diskGrade.color = "#66bb00";
        } else if(diskUsage <= 70){         //61-70%
            diskGrade.score = 50;
            diskGrade.color = "#99bb00";
        } else if(diskUsage <= 80){         //71-80%
            diskGrade.score = 100;
            diskGrade.color = "#bbaa00";
        } else if(diskUsage <= 90){        //81-90%
            diskGrade.score = 200;
            diskGrade.color = "#bb4400";
        } else if(diskUsage <= 95){        //91-95%
            diskGrade.score = 300;
            diskGrade.color = "#bb4400";
        }
        else {                              //96-100%
            diskGrade.score = 600;
            diskGrade.color = "#ff0000";
        }
    }

    return diskGrade;
}

function calculateTemperatureGrade(temperature)
{
    //Temperature grade can have a value between 0 and 600 (0 = very good, 600 = very bad)
    var temperatureGrade = {};
    temperatureGrade.score = 0.0;
    temperatureGrade.color = "#00bb00";

    //A common idle temperature of the raspberry pi is 50°C
    //A temperature above 85°C is critical
    if(temperature > 55)
    {
        if(temperature <= 60) {                 //56-60°C
            temperatureGrade.score = 25;
            temperatureGrade.color = "#66bb00";
        } else if(temperature <= 65){           //61-65°C
            temperatureGrade.score = 50;
            temperatureGrade.color = "#bbaa00";
        } else if(temperature <= 70){           //66-70°C
            temperatureGrade.score = 100;
            temperatureGrade.color = "#bb8800";
        } else if(temperature <= 75){           //71-75°C
            temperatureGrade.score = 200;
            temperatureGrade.color = "#bb8800";
        } else if(temperature <= 80){           //76-80°C
            temperatureGrade.score = 300;
            temperatureGrade.color = "#bb4400";
        } else if(temperature <= 85){           //81-85°C
            temperatureGrade.score = 400;
            temperatureGrade.color = "#bb0000";
        }
        else {                                  //>85°C
            temperatureGrade.score = 600;
            temperatureGrade.color = "#ff0000";
        }
    }

    return temperatureGrade;
}

angular.module('portainer.docker')
.factory('GradingHelper', [function GradingHelperFactory() {
  'use strict';

    var helper = {};
    var maxSingleGradeValue = 600;

    helper.calculateGrade = function(gradingFactors, cpuUsage, ramUsage, diskUsage, temperature)
    {
        var gradeVal = {};
        var cpuGradingFactor = gradingFactors.CPUGradingFactor;
        var ramGradingFactor = gradingFactors.RAMGradingFactor;
        var diskGradingFactor = gradingFactors.DiskGradingFactor;
        var temperatureGradingFactor = gradingFactors.CPUTempGradingFactor;
        
        //CPU grading
        gradeVal.cpu = calculateCPUGrade(cpuUsage);

        //RAM grading
        gradeVal.ram = calculateRAMGrade(ramUsage);
        
        //Disk grading
        gradeVal.disk = calculateDiskGrade(diskUsage);

        //Temperature grading
        gradeVal.temperature = calculateTemperatureGrade(temperature);

        //Convert from 0-600 system into 0-100 system
        gradeVal.score = gradeVal.cpu.score * cpuGradingFactor + gradeVal.ram.score * ramGradingFactor + gradeVal.disk.score * diskGradingFactor + gradeVal.temperature.score * temperatureGradingFactor;
        gradeVal.score = 100 - ((gradeVal.score / (maxSingleGradeValue * (cpuGradingFactor + ramGradingFactor + diskGradingFactor + temperatureGradingFactor))) * 100);
        
        //Convert value to grade
        if (gradeVal.score > 95) {
            gradeVal.grade = "A+";
            gradeVal.color = "#00bb00";
        }
        else if (gradeVal.score >= 90) {
            gradeVal.grade = "A";
            gradeVal.color = "#33bb00";
        }
        else if (gradeVal.score > 85) {
            gradeVal.grade = "B+";
            gradeVal.color = "#66bb00";
        }
        else if (gradeVal.score >= 80) {
            gradeVal.grade = "B";
            gradeVal.color = "#99bb00";
        }
        else if (gradeVal.score > 75) {
            gradeVal.grade = "C+";
            gradeVal.color = "#bbaa00";
        }
        else if (gradeVal.score >= 70) {
            gradeVal.grade = "C";
            gradeVal.color = "#bb8800";
        }
        else if (gradeVal.score >= 60) {
            gradeVal.grade = "D";
            gradeVal.color = "#bb4400";
        }
        else if (gradeVal.score >= 50) {
            gradeVal.grade = "E";
            gradeVal.color = "#bb0000";
        }
        else {
            gradeVal.grade = "F";
            gradeVal.color = "#ff0000";
        }

        return gradeVal;
    }

  return helper;
}]);
