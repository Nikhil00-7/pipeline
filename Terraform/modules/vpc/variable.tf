variable "cidr_block" {
   type = string 
   description = "IP address range"
}

variable "environment" {
   type = string
}

variable "application" {
  type = string
  description = "Application name"
}

variable "cluster_name" {
  type = string
  description = "EKS Cluster name"
}
