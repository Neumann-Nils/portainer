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
	//Alternative command for Raspberry Pi: vcgencmd measure_temp | egrep -o '[0-9]*\.[0-9]*'
	//Piped command: cat /proc/stat | grep 'cpu [0-9]*' | grep -o '[0-9]*'
	//Piped command: uptime | grep -o 'load average: .*' | grep -o '[0-9]*'
	var temp int = 0

	//Get cpu temperature from sensors command
	cmd, err := exec.Command("bash", "-c", "sensors -u | grep -A 1 'Package' | grep 'temp1_input:' | grep -o '[0-9]*' | awk '{i++}i==2'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, "Failed to execute command 'sensors'")
	}

	//Go through each character and add up the temperature (last char is a new-line character)
	for i := 0; i < len(cmd)-1; i++ {
		temp += int(cmd[i] % 48)
		temp *= 10
	}
	sysInfo.CPUInfo.Temperature = (temp / 10)

	//Get cpu utilization from uptime command
	cmd, err = exec.Command("bash", "-c", "uptime | grep -o 'load average: .*' | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, "Failed to execute command 'uptime'")
	}

	//Go through each character and add up the utilization (last char is a new-line character)
	temp = 0
	var counter = 0
	for i := 0; i < len(cmd)-1; i++ {
		if cmd[i] != '\n' {
			temp += int(cmd[i] % 48)
			temp *= 10
		} else {
			counter++
			switch counter {
			case 2:
				sysInfo.CPUInfo.Utilization.LastMin = float32(temp) / 1000
				temp = 0
				break
			case 4:
				sysInfo.CPUInfo.Utilization.LastFiveMin = float32(temp) / 1000
				temp = 0
				break
			case 6:
				sysInfo.CPUInfo.Utilization.LastFifteenMin = float32(temp) / 1000
				temp = 0
				break
			}
		}
	}
}

func getRAMUtilization(sysInfo *portainer.EndpointSystemInfo) {
	//Piped command: cat /proc/meminfo | grep 'MemTotal' | grep -o '[0-9]*'
	//Piped command: cat /proc/meminfo | grep 'MemAvailable' | grep -o '[0-9]*'
	var tmp int = 0

	//Get information from /proc/meminfo
	cmd, err := exec.Command("bash", "-c", "cat /proc/meminfo | grep 'MemTotal' | grep -o '[0-9]*'").Output()
	if err != nil {
		sysInfo.Error = append(sysInfo.Error, "Failed to fetch 'meminfo' (1)")
	}

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
		sysInfo.Error = append(sysInfo.Error, "Failed to fetch 'meminfo' (2)")
	}

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
		sysInfo.Error = append(sysInfo.Error, "Failed to execute command 'df' (1)")
	}

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
		sysInfo.Error = append(sysInfo.Error, "Failed to execute command 'df' (2)")
	}

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
		sysInfo.Error = append(sysInfo.Error, "Failed to fetch 'uptime'")
	}

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
