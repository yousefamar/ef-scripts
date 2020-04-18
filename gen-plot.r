library(ggplot2)
library(dplyr)

data   = read.csv('./ld14-intercom-log.csv')
#data$Timestamp = floor(data$Timestamp / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000
#data   = aggregate(. ~ Timestamp + Group, data = data, max)
dates  = unique(data$Timestamp)
groups = unique(data$Group)
combinations = expand.grid(Timestamp = dates, Group = groups)

data = data %>%
	full_join(combinations, by = c("Timestamp" = "Timestamp", "Group" = "Group")) %>%
	mutate(Count = ifelse(is.na(Count), 0, Count)) %>%
	arrange(Timestamp, Group) %>%
	mutate(Group = factor(Group, levels = c("Sole Founders (1st time)", "In a Team (1st time)", "Sole Founders (2nd time)", "In a Team (2nd time)", "Sole Founders (3rd time)", "In a Team (3rd time)", "Sole Founders (4th time)", "In a Team (4th time)")))

ggplot(data, aes(x = as.POSIXct(Timestamp/1000, origin="1970-01-01"), y = Count, fill = Group)) +
	geom_area() +
	geom_vline(aes(xintercept = as.POSIXct(1586131200, origin="1970-01-01")), color="purple") +
	geom_text(aes(x=as.POSIXct(1586131200, origin="1970-01-01") + 60000, label="Start of Form", y=60), color="purple", angle=90, size=4) +
	geom_vline(aes(xintercept = as.POSIXct(1584144000, origin="1970-01-01")), color="purple") +
	geom_text(aes(x=as.POSIXct(1584144000, origin="1970-01-01") + 60000, label="KOWE", y=60), color="purple", angle=90, size=4) +
	theme_bw(base_size=14) +
	scale_fill_brewer(palette = 'Paired') +
	xlab("Time") +
	ylab("Count")

ggsave('./plot.png', width = 10, height = 5)
