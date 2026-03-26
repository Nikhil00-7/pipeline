variable "cluster_name" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "endpoint_private_access" {
  type = string
}
variable "subnet_ids" {
  type = list(string)
}

variable "endpoint_public_access" {
  type = string
}

variable "public_access_cidrs" {
  type = list(string)
}

variable "cluster_role_arn" {
   type = string
}

variable "node_group_name" {
  type = string
}

variable "node_role_arn" {
  type = string
}