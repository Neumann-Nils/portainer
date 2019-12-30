package endpoints

import (
	"net/http"

	httperror "github.com/portainer/libhttp/error"
	"github.com/portainer/libhttp/request"
	"github.com/portainer/libhttp/response"
	portainer "github.com/portainer/portainer/api"

	"os/exec"
)

// GET request on /api/endpoints/:id
func (handler *Handler) endpointInspect(w http.ResponseWriter, r *http.Request) *httperror.HandlerError {
	endpointID, err := request.RetrieveNumericRouteVariableValue(r, "id")
	if err != nil {
		return &httperror.HandlerError{http.StatusBadRequest, "Invalid endpoint identifier route variable", err}
	}

	endpoint, err := handler.EndpointService.Endpoint(portainer.EndpointID(endpointID))
	if err == portainer.ErrObjectNotFound {
		return &httperror.HandlerError{http.StatusNotFound, "Unable to find an endpoint with the specified identifier inside the database", err}
	} else if err != nil {
		return &httperror.HandlerError{http.StatusInternalServerError, "Unable to find an endpoint with the specified identifier inside the database", err}
	}

	err = handler.requestBouncer.AuthorizedEndpointOperation(r, endpoint, false)
	if err != nil {
		return &httperror.HandlerError{http.StatusForbidden, "Permission denied to access endpoint", err}
	}

	hideFields(endpoint)

	getCPUInformation(&endpoint.SystemInfo)
	getRAMUtilization(&endpoint.SystemInfo)
	getDiskUtilization(&endpoint.SystemInfo)
	getSystemUptime(&endpoint.SystemInfo)

	return response.JSON(w, endpoint)
}

func getCPUInformation(sysInfo *portainer.EndpointSystemInfo) {
	//Piped command: sensors -u | grep -A 1 'Package' | grep 'temp1_input:' | grep -o '[0-9]*' | awk '{i++}i==2'
	//Piped command: cat /proc/stat | grep 'cpu [0-9]*' | grep -o '[0-9]*'
	var temp int = 0

	//Get cpu temperature from sensors command
	cmd, err := exec.Command("bash", "-c", "sensors -u | grep -A 1 'Package' | grep 'temp1_input:' | grep -o '[0-9]*' | awk '{i++}i==2'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the temperature (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		temp += int(cmd[i] % 48)
		temp *= 10
	}
	sysInfo.CPUInfo.Temperature = (temp / 10)

	//Get cpu utilization from uptime command
	cmd, err = exec.Command("bash", "-c", "uptime | grep -o 'load average: [0-9]\\.[0-9]*' | grep -o '[0-9]*\\.[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the utilization (last char is a new-line character)
	temp = 0
	for i := 0; i < len(cmd)-1; i++ {
		if cmd[i] != '.' {
			temp += int(cmd[i] % 48)
			temp *= 10
		}
	}
	sysInfo.CPUInfo.Utilization = float32(temp) / 1000

	//Get cpu utilization from /proc/stat in two steps
	//Get information from /proc/stat one time and some time later to calculate cpu utilization
	/*cmd, err = exec.Command("bash", "-c", "cat /proc/stat | grep 'cpu [0-9]*' | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	var reset = 0
	var tmp = 0
	var usedTime1 = 0
	var idleTime1 = 0
	var usedTime2 = 0
	var idleTime2 = 0

	//Calculate used_time1 and idle_time1
	for i := 0; i < len(cmd)-1; i++ {
		if cmd[i] == '\n' {
			reset++
			switch reset {
			case 1:
			case 2:
			case 3:
				usedTime1 += (tmp / 10)
				break
			case 4:
				idleTime1 += (tmp / 10)
				break
			default:
				break
			}
			tmp = 0
		} else {
			tmp += int(cmd[i] % 48)
			tmp *= 10
		}
	}

	time.Sleep(100 * time.Millisecond)

	tmp = 0
	reset = 0
	cmd, err = exec.Command("bash", "-c", "cat /proc/stat | grep 'cpu [0-9]*' | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))
	//Calculate used_time2 and idle_time2
	for i := 0; i < len(cmd)-1; i++ {
		if cmd[i] == '\n' {
			reset++
			switch reset {
			case 1:
			case 2:
			case 3:
				usedTime2 += (tmp / 10)
				break
			case 4:
				idleTime2 += (tmp / 10)
				break
			default:
				break
			}
			tmp = 0
		} else {
			tmp += int(cmd[i] % 48)
			tmp *= 10
		}
	}

	var timeDelta = (usedTime2 + idleTime2) - (usedTime1 + idleTime1)
	var usedTime = usedTime2 - usedTime1
	sysInfo.Error = append(sysInfo.Error, strconv.FormatInt(int64(timeDelta), 10))
	sysInfo.Error = append(sysInfo.Error, strconv.FormatInt(int64(usedTime), 10))
	sysInfo.CPUInfo.Utilization = 100 * float32(usedTime) / float32(timeDelta)*/
}

func getRAMUtilization(sysInfo *portainer.EndpointSystemInfo) {
	//Piped command: cat /proc/meminfo | grep 'MemTotal' | grep -o '[0-9]*'
	//Piped command: cat /proc/meminfo | grep 'MemAvailable' | grep -o '[0-9]*'
	var tmp int = 0

	//Get information from /proc/meminfo
	cmd, err := exec.Command("bash", "-c", "cat /proc/meminfo | grep 'MemTotal' | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the total memory (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		tmp += int(cmd[i] % 48)
		tmp *= 10
	}
	sysInfo.MemoryUsage.Total = (tmp * 100)

	//Get used memory
	tmp = 0
	cmd, err = exec.Command("bash", "-c", "cat /proc/meminfo | grep 'MemAvailable' | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the free memory (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		tmp += int(cmd[i] % 48)
		tmp *= 10
	}
	sysInfo.MemoryUsage.Available = (tmp * 100)
	sysInfo.MemoryUsage.Used = sysInfo.MemoryUsage.Total - sysInfo.MemoryUsage.Available
}

func getDiskUtilization(sysInfo *portainer.EndpointSystemInfo) {
	//Piped command: df --output=pcent / | grep -o '[0-9]*'
	var tmp int = 0

	//Get available disk space on /
	cmd, err := exec.Command("bash", "-c", "df --output=avail / | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the usage (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		tmp += int(cmd[i] % 48)
		tmp *= 10
	}
	sysInfo.DiskUsage.Available = (tmp * 100)

	//Get used disk space on /
	tmp = 0
	cmd, err = exec.Command("bash", "-c", "df --output=used / | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the usage (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		tmp += int(cmd[i] % 48)
		tmp *= 10
	}
	sysInfo.DiskUsage.Used = (tmp * 100)
	sysInfo.DiskUsage.Total = sysInfo.DiskUsage.Available + sysInfo.DiskUsage.Used
}

func getSystemUptime(sysInfo *portainer.EndpointSystemInfo) {
	//Command: cat /proc/uptime
	var time int = 0

	//Get system uptime
	cmd, err := exec.Command("bash", "-c", "cat /proc/uptime").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, err.Error())
	}
	sysInfo.Error = append(sysInfo.Error, string(cmd))

	//Go through each character and add up the system uptime (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		if cmd[i] == '.' {
			break
		}
		time += int(cmd[i] % 48)
		time *= 10
	}
	sysInfo.Uptime = (time / 10)
}
